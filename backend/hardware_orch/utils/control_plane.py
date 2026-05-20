from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from django.conf import settings
from django.db import transaction

from hardware_orch.models import ModelImage, ModelImageDeployment


DEPLOYMENTS_ROOT = settings.BASE_DIR / "hardware_orch" / "deployments" / "llm"
MANIFEST_NAME = "model_image.json"
DEFAULT_INTERNAL_PORT = 8000
DEFAULT_HOST_BASE_PORT = 8100
DEFAULT_PUBLIC_HOST = "http://localhost"


@dataclass(frozen=True)
class EndpointSpec:
    name: str
    method: str
    public_path: str
    upstream_path: str


@dataclass(frozen=True)
class ModelImageSpec:
    slug: str
    name: str
    family: str
    image: str
    context: str
    dockerfile: str
    internal_port: int = DEFAULT_INTERNAL_PORT
    health_path: str = "/health"
    env: dict[str, str] = field(default_factory=dict)
    endpoints: list[EndpointSpec] = field(default_factory=list)
    description: str = ""

    @property
    def context_path(self) -> Path:
        return (DEPLOYMENTS_ROOT / self.context).resolve()

    @property
    def dockerfile_path(self) -> Path:
        return (DEPLOYMENTS_ROOT / self.dockerfile).resolve()

    def to_model_defaults(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "family": self.family,
            "image": self.image,
            "context": self.context,
            "dockerfile": self.dockerfile,
            "internal_port": self.internal_port,
            "health_path": self.health_path,
            "env": self.env,
            "endpoints": [asdict(endpoint) for endpoint in self.endpoints],
            "description": self.description,
        }


@dataclass(frozen=True)
class RouteSpec:
    model: str
    deployment_id: int | None
    endpoint: str
    method: str
    public_path: str
    public_url: str
    upstream_url: str


@dataclass(frozen=True)
class RuntimeSpec:
    model: str
    deployment_id: int | None
    service_name: str
    image: str
    build_context: str
    dockerfile: str
    internal_port: int
    host_port: int
    health_url: str
    env: dict[str, str]


@dataclass(frozen=True)
class DeploymentPlan:
    provider: str
    routes: list[RouteSpec]
    runtimes: list[RuntimeSpec]


def _read_manifest(path: Path) -> ModelImageSpec:
    payload = json.loads(path.read_text())
    endpoints = [EndpointSpec(**endpoint) for endpoint in payload.get("endpoints", [])]
    return ModelImageSpec(
        slug=payload["slug"],
        name=payload["name"],
        family=payload.get("family", "llm"),
        image=payload["image"],
        context=payload["context"],
        dockerfile=payload["dockerfile"],
        internal_port=payload.get("internal_port", DEFAULT_INTERNAL_PORT),
        health_path=payload.get("health_path", "/health"),
        env=payload.get("env", {}),
        endpoints=endpoints,
        description=payload.get("description", ""),
    )


def discover_model_image_specs(root: Path = DEPLOYMENTS_ROOT) -> dict[str, ModelImageSpec]:
    images: dict[str, ModelImageSpec] = {}
    for manifest_path in sorted(root.glob(f"*/{MANIFEST_NAME}")):
        spec = _read_manifest(manifest_path)
        if spec.slug in images:
            raise ValueError(f"Duplicate model image slug: {spec.slug}")
        images[spec.slug] = spec
    return images


def sync_model_images_from_manifests() -> list[ModelImage]:
    synced_images: list[ModelImage] = []
    for spec in discover_model_image_specs().values():
        image, _ = ModelImage.objects.update_or_create(
            slug=spec.slug,
            defaults=spec.to_model_defaults(),
        )
        synced_images.append(image)
    return synced_images


def _selected_images(model_slugs: list[str] | None) -> list[ModelImage]:
    if not ModelImage.objects.exists():
        sync_model_images_from_manifests()

    queryset = ModelImage.objects.filter(is_active=True).order_by("slug")
    if model_slugs is None:
        return list(queryset)

    images = list(queryset.filter(slug__in=model_slugs))
    found_slugs = {image.slug for image in images}
    missing = sorted(set(model_slugs) - found_slugs)
    if missing:
        raise ValueError(f"Unknown model image slug(s): {', '.join(missing)}")

    return sorted(images, key=lambda image: model_slugs.index(image.slug))


def _next_available_ports(count: int, host_base_port: int) -> list[int]:
    used_ports = set(
        ModelImageDeployment.objects.exclude(status=ModelImageDeployment.STATUS_DESTROYED)
        .exclude(host_port__isnull=True)
        .values_list("host_port", flat=True)
    )
    ports: list[int] = []
    candidate = host_base_port
    while len(ports) < count:
        if candidate not in used_ports and candidate not in ports:
            ports.append(candidate)
        candidate += 1
    return ports


def _runtime_and_routes(
    *,
    image: ModelImage,
    provider: str,
    public_host: str,
    host_port: int,
    deployment_id: int | None = None,
) -> tuple[RuntimeSpec, list[RouteSpec]]:
    service_name = f"llm-{image.slug}"
    normalized_host = public_host.rstrip("/")
    public_base = f"{normalized_host}:{host_port}"
    upstream_base = f"http://{service_name}:{image.internal_port}"

    runtime = RuntimeSpec(
        model=image.slug,
        deployment_id=deployment_id,
        service_name=service_name,
        image=image.image,
        build_context=str((DEPLOYMENTS_ROOT / image.context).resolve()),
        dockerfile=str((DEPLOYMENTS_ROOT / image.dockerfile).resolve()),
        internal_port=image.internal_port,
        host_port=host_port,
        health_url=f"{public_base}{image.health_path}",
        env=image.env,
    )
    routes = [
        RouteSpec(
            model=image.slug,
            deployment_id=deployment_id,
            endpoint=endpoint["name"],
            method=endpoint["method"].upper(),
            public_path=endpoint["public_path"],
            public_url=f"{public_base}{endpoint['public_path']}",
            upstream_url=f"{upstream_base}{endpoint['upstream_path']}",
        )
        for endpoint in image.endpoints
    ]
    return runtime, routes


def create_deployment_plan(
    *,
    models: list[str] | None = None,
    provider: str = ModelImageDeployment.PROVIDER_LOCAL_DOCKER,
    public_host: str = DEFAULT_PUBLIC_HOST,
    host_base_port: int = DEFAULT_HOST_BASE_PORT,
) -> DeploymentPlan:
    images = _selected_images(models)
    ports = _next_available_ports(len(images), host_base_port)
    runtimes: list[RuntimeSpec] = []
    routes: list[RouteSpec] = []

    for image, host_port in zip(images, ports, strict=True):
        runtime, image_routes = _runtime_and_routes(
            image=image,
            provider=provider,
            public_host=public_host,
            host_port=host_port,
        )
        runtimes.append(runtime)
        routes.extend(image_routes)

    return DeploymentPlan(provider=provider, routes=routes, runtimes=runtimes)


@transaction.atomic
def create_deployments(
    *,
    owner,
    models: list[str] | None = None,
    provider: str = ModelImageDeployment.PROVIDER_LOCAL_DOCKER,
    public_host: str = DEFAULT_PUBLIC_HOST,
    host_base_port: int = DEFAULT_HOST_BASE_PORT,
) -> list[ModelImageDeployment]:
    images = _selected_images(models)
    ports = _next_available_ports(len(images), host_base_port)
    deployments: list[ModelImageDeployment] = []

    for image, host_port in zip(images, ports, strict=True):
        runtime, routes = _runtime_and_routes(
            image=image,
            provider=provider,
            public_host=public_host,
            host_port=host_port,
        )
        deployment = ModelImageDeployment.objects.create(
            owner=owner,
            model_image=image,
            provider=provider,
            status=ModelImageDeployment.STATUS_PLANNED,
            service_name=runtime.service_name,
            host_port=host_port,
            public_host=public_host.rstrip("/"),
            runtime=asdict(runtime),
            routes=[asdict(route) for route in routes],
        )
        runtime, routes = _runtime_and_routes(
            image=image,
            provider=provider,
            public_host=public_host,
            host_port=host_port,
            deployment_id=deployment.id,
        )
        deployment.runtime = asdict(runtime)
        deployment.routes = [asdict(route) for route in routes]
        deployment.save(update_fields=["runtime", "routes", "updated_at"])
        deployments.append(deployment)

    return deployments


def create_compose_spec(deployments: list[ModelImageDeployment], project_name: str) -> dict[str, Any]:
    services: dict[str, Any] = {}
    volumes: dict[str, Any] = {}

    for deployment in deployments:
        runtime = deployment.runtime
        cache_volume = f"{runtime['service_name']}-hf-cache"
        volumes[cache_volume] = {}
        services[runtime["service_name"]] = {
            "image": runtime["image"],
            "build": {
                "context": runtime["build_context"],
                "dockerfile": runtime["dockerfile"],
            },
            "ports": [f"{runtime['host_port']}:{runtime['internal_port']}"],
            "environment": runtime["env"],
            "volumes": [f"{cache_volume}:/models/huggingface"],
            "restart": "unless-stopped",
        }

    return {
        "name": project_name,
        "services": services,
        "volumes": volumes,
    }


def dataclass_to_dict(value) -> dict[str, Any]:
    return asdict(value)
