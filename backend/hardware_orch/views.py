import json
import os
import tempfile
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import urlretrieve

from asgiref.sync import sync_to_async
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import HardwareProfile, ModelProfile
from .serializers import (
    ComposeSpecRequestSerializer,
    DeploymentCreateSerializer,
    DeploymentPlanRequestSerializer,
    HardwareRecommendationRequestSerializer,
    HardwareRecommendationResponseSerializer,
    HardwareProfileSerializer,
    ModelImageDeploymentSerializer,
    ModelImageSerializer,
    ModelProfileSerializer,
)
from .models import ModelImageDeployment
from .utils.control_plane import (
    create_compose_spec,
    create_deployment_plan,
    create_deployments,
    dataclass_to_dict,
    sync_model_images_from_manifests,
)
from .utils.hardware_scoring import HardwareSelector, generate_deploy_config
from .utils.model_profiler import create_profiler


def _is_remote_source(source: str) -> bool:
    parsed = urlparse(source)
    return parsed.scheme in {"http", "https"}


def _resolve_local_source(source: str) -> Path:
    candidates = [
        Path(source).expanduser(),
        settings.BASE_DIR / source,
        settings.BASE_DIR.parent / source,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate.resolve()
    raise FileNotFoundError(f"Unable to resolve local model source: {source}")


async def _materialize_model_source(source: str) -> tuple[str, str]:
    if _is_remote_source(source):
        suffix = Path(urlparse(source).path).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = temp_file.name
        await sync_to_async(urlretrieve, thread_sensitive=False)(source, temp_path)
        return temp_path, ModelProfile.SOURCE_KIND_URL
    return str(_resolve_local_source(source)), ModelProfile.SOURCE_KIND_PATH


async def _profile_model_source(model_path: str):
    profiler = await sync_to_async(create_profiler, thread_sensitive=False)(model_path)
    return await sync_to_async(profiler.get_profile, thread_sensitive=False)()


async def _score_model_profile(profile, *, prefer, providers, use_spot, allow_inferentia):
    selector = HardwareSelector(
        providers=providers or None,
        use_spot=use_spot,
        prefer=prefer,
        allow_inferentia=allow_inferentia,
    )
    return await sync_to_async(selector.select, thread_sensitive=False)(profile, prefer=prefer)


def _scored_instance_to_dict(scored_instance) -> dict:
    instance = scored_instance.instance
    return {
        "provider": instance.provider,
        "instance_name": instance.name,
        "gpu_model": instance.gpu_model,
        "gpu_count": instance.gpu_count,
        "vram_gb": instance.total_vram_gb,
        "ram_gb": instance.ram_gb,
        "score": scored_instance.score,
        "cost_per_hour": scored_instance.cost_per_hour,
        "vram_headroom": scored_instance.vram_headroom,
        "notes": instance.notes,
    }


def _parse_json_body(request):
    try:
        return json.loads(request.body or "{}"), None
    except json.JSONDecodeError:
        return None, JsonResponse({"detail": "Invalid JSON payload."}, status=400)


def _authenticated_user(request):
    if getattr(request, "user", None) and request.user.is_authenticated:
        return request.user, None

    try:
        from rest_framework_simplejwt.authentication import JWTAuthentication

        authenticated = JWTAuthentication().authenticate(request)
    except Exception:
        authenticated = None

    if authenticated is None:
        return None, JsonResponse({"detail": "Authentication credentials were not provided."}, status=401)

    user, _token = authenticated
    return user, None


async def _persist_recommendation(payload, source_kind, profile, selection):
    model_profile = await ModelProfile.objects.acreate(
        model_name=payload.get("model_name", ""),
        source=payload["model_source"],
        source_kind=source_kind,
        preferred_optimization=payload["prefer"],
        requested_providers=payload.get("providers", []),
        use_spot=payload["use_spot"],
        allow_inferentia=payload["allow_inferentia"],
        profile_summary=selection.profile_summary,
        profile_data=profile.to_dict(),
    )

    recommended = selection.recommendation
    hardware_profile = await HardwareProfile.objects.acreate(
        model_profile=model_profile,
        provider=recommended.instance.provider,
        instance_name=recommended.instance.name,
        gpu_model=recommended.instance.gpu_model or "",
        gpu_count=recommended.instance.gpu_count,
        total_vram_gb=recommended.instance.total_vram_gb,
        ram_gb=recommended.instance.ram_gb,
        score=recommended.score,
        cost_per_hour=recommended.cost_per_hour,
        vram_headroom=recommended.vram_headroom,
        recommendation_data=_scored_instance_to_dict(recommended),
        deployment_config=generate_deploy_config(recommended, profile),
    )
    return model_profile, hardware_profile


@csrf_exempt
async def recommend_hardware(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    serializer = HardwareRecommendationRequestSerializer(data=payload)
    is_valid = await sync_to_async(serializer.is_valid, thread_sensitive=True)()
    if not is_valid:
        return JsonResponse(serializer.errors, status=400)

    data = serializer.validated_data

    model_path = None
    source_kind = None
    try:
        model_path, source_kind = await _materialize_model_source(data["model_source"])
        profile = await _profile_model_source(model_path)
        selection = await _score_model_profile(
            profile,
            prefer=data["prefer"],
            providers=data.get("providers"),
            use_spot=data["use_spot"],
            allow_inferentia=data["allow_inferentia"],
        )
    except Exception as exc:
        return JsonResponse({"detail": str(exc)}, status=400)
    finally:
        if model_path and source_kind == ModelProfile.SOURCE_KIND_URL:
            try:
                await sync_to_async(os.unlink, thread_sensitive=False)(model_path)
            except FileNotFoundError:
                pass

    model_profile, hardware_profile = await _persist_recommendation(
        data,
        source_kind,
        profile,
        selection,
    )

    response_serializer = HardwareRecommendationResponseSerializer(
        {
            "model_profile": await sync_to_async(
                lambda: ModelProfileSerializer(model_profile).data,
                thread_sensitive=True,
            )(),
            "hardware_profile": await sync_to_async(
                lambda: HardwareProfileSerializer(hardware_profile).data,
                thread_sensitive=True,
            )(),
            "profile_summary": selection.profile_summary,
            "top_recommendation": _scored_instance_to_dict(selection.recommendation),
        }
    )
    response_data = await sync_to_async(lambda: response_serializer.data, thread_sensitive=True)()
    return JsonResponse(response_data, status=201)


@csrf_exempt
async def model_profile_detail(request, profile_id: int):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    try:
        model_profile = await ModelProfile.objects.aget(pk=profile_id)
        hardware_profile = await HardwareProfile.objects.filter(model_profile=model_profile).order_by("-created_at").afirst()
    except ModelProfile.DoesNotExist:
        return JsonResponse({"detail": "Model profile not found."}, status=404)

    if hardware_profile is None:
        return JsonResponse({"detail": "Hardware profile not found."}, status=404)

    response_data = {
        "model_profile": await sync_to_async(lambda: ModelProfileSerializer(model_profile).data, thread_sensitive=True)(),
        "hardware_profile": await sync_to_async(
            lambda: HardwareProfileSerializer(hardware_profile).data,
            thread_sensitive=True,
        )(),
        "profile_summary": model_profile.profile_summary,
        "top_recommendation": hardware_profile.recommendation_data,
    }
    return JsonResponse(response_data, status=200)


@csrf_exempt
def control_plane_images(request):
    if request.method == "GET":
        images = sync_model_images_from_manifests()
        return JsonResponse(
            {
                "count": len(images),
                "images": ModelImageSerializer(images, many=True).data,
            },
            status=200,
        )

    if request.method == "POST":
        _user, auth_response = _authenticated_user(request)
        if auth_response:
            return auth_response

        images = sync_model_images_from_manifests()
        return JsonResponse(
            {
                "detail": "Model image manifests synced.",
                "count": len(images),
                "images": ModelImageSerializer(images, many=True).data,
            },
            status=200,
        )

    return JsonResponse({"detail": "Method not allowed."}, status=405)


@csrf_exempt
def control_plane_deployment_plan(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    payload, error_response = _parse_json_body(request)
    if error_response:
        return error_response

    serializer = DeploymentPlanRequestSerializer(data=payload)
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    try:
        plan = create_deployment_plan(**serializer.validated_data)
    except ValueError as exc:
        return JsonResponse({"detail": str(exc)}, status=400)

    return JsonResponse(dataclass_to_dict(plan), status=200)


@csrf_exempt
def control_plane_deployments(request):
    user, auth_response = _authenticated_user(request)
    if auth_response:
        return auth_response

    if request.method == "GET":
        deployments = ModelImageDeployment.objects.filter(owner=user).select_related("model_image")
        return JsonResponse(
            {
                "count": deployments.count(),
                "deployments": ModelImageDeploymentSerializer(deployments, many=True).data,
            },
            status=200,
        )

    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    payload, error_response = _parse_json_body(request)
    if error_response:
        return error_response

    serializer = DeploymentCreateSerializer(data=payload)
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    try:
        deployments = create_deployments(owner=user, **serializer.validated_data)
    except ValueError as exc:
        return JsonResponse({"detail": str(exc)}, status=400)

    return JsonResponse(
        {
            "count": len(deployments),
            "deployments": ModelImageDeploymentSerializer(deployments, many=True).data,
        },
        status=201,
    )


@csrf_exempt
def control_plane_deployment_detail(request, deployment_id: int):
    user, auth_response = _authenticated_user(request)
    if auth_response:
        return auth_response

    try:
        deployment = ModelImageDeployment.objects.select_related("model_image").get(
            pk=deployment_id,
            owner=user,
        )
    except ModelImageDeployment.DoesNotExist:
        return JsonResponse({"detail": "Deployment not found."}, status=404)

    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    return JsonResponse(ModelImageDeploymentSerializer(deployment).data, status=200)


@csrf_exempt
def control_plane_destroy_deployment(request, deployment_id: int):
    user, auth_response = _authenticated_user(request)
    if auth_response:
        return auth_response

    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    try:
        deployment = ModelImageDeployment.objects.select_related("model_image").get(
            pk=deployment_id,
            owner=user,
        )
    except ModelImageDeployment.DoesNotExist:
        return JsonResponse({"detail": "Deployment not found."}, status=404)

    deployment.status = ModelImageDeployment.STATUS_DESTROYED
    deployment.save(update_fields=["status", "updated_at"])
    return JsonResponse(ModelImageDeploymentSerializer(deployment).data, status=200)


@csrf_exempt
def control_plane_compose_spec(request):
    user, auth_response = _authenticated_user(request)
    if auth_response:
        return auth_response

    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    payload, error_response = _parse_json_body(request)
    if error_response:
        return error_response

    serializer = ComposeSpecRequestSerializer(data=payload)
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    deployments = list(
        ModelImageDeployment.objects.filter(
            owner=user,
            id__in=serializer.validated_data["deployment_ids"],
        )
        .exclude(status=ModelImageDeployment.STATUS_DESTROYED)
        .select_related("model_image")
    )
    if len(deployments) != len(serializer.validated_data["deployment_ids"]):
        return JsonResponse({"detail": "One or more deployments were not found."}, status=404)

    compose_spec = create_compose_spec(deployments, serializer.validated_data["project_name"])
    return JsonResponse(compose_spec, status=200)
