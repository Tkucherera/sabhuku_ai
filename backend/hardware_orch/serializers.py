from pathlib import Path
from urllib.parse import urlparse

from django.conf import settings
from rest_framework import serializers

from .models import HardwareProfile, ModelImage, ModelImageDeployment, ModelProfile


class HardwareRecommendationRequestSerializer(serializers.Serializer):
    model_source = serializers.CharField(max_length=1024)
    model_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    prefer = serializers.ChoiceField(
        choices=[ModelProfile.PREFER_COST, ModelProfile.PREFER_LATENCY, ModelProfile.PREFER_BALANCED],
        default=ModelProfile.PREFER_BALANCED,
    )
    providers = serializers.ListField(
        child=serializers.ChoiceField(choices=["gcp", "aws", "local"]),
        required=False,
        allow_empty=False,
    )
    use_spot = serializers.BooleanField(default=False)
    allow_inferentia = serializers.BooleanField(default=False)

    def validate_model_source(self, value):
        source = value.strip()
        if not source:
            raise serializers.ValidationError("model_source is required")

        parsed = urlparse(source)
        if parsed.scheme in {"http", "https"}:
            return source

        candidates = [
            Path(source).expanduser(),
            settings.BASE_DIR / source,
            settings.BASE_DIR.parent / source,
        ]
        if any(candidate.exists() for candidate in candidates):
            return source

        raise serializers.ValidationError("model_source must be an existing local path or an http(s) URL")


class ModelProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelProfile
        fields = [
            "id",
            "model_name",
            "source",
            "source_kind",
            "preferred_optimization",
            "requested_providers",
            "use_spot",
            "allow_inferentia",
            "profile_summary",
            "profile_data",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "profile_summary", "profile_data", "created_at", "updated_at"]


class HardwareProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = HardwareProfile
        fields = [
            "id",
            "model_profile",
            "provider",
            "instance_name",
            "gpu_model",
            "gpu_count",
            "total_vram_gb",
            "ram_gb",
            "score",
            "cost_per_hour",
            "vram_headroom",
            "recommendation_data",
            "deployment_config",
            "created_at",
        ]
        read_only_fields = fields


class HardwareRecommendationResponseSerializer(serializers.Serializer):
    model_profile = ModelProfileSerializer()
    hardware_profile = HardwareProfileSerializer()
    profile_summary = serializers.CharField()
    top_recommendation = serializers.DictField()


class ModelImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelImage
        fields = [
            "id",
            "slug",
            "name",
            "family",
            "image",
            "context",
            "dockerfile",
            "internal_port",
            "health_path",
            "env",
            "endpoints",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class DeploymentPlanRequestSerializer(serializers.Serializer):
    models = serializers.ListField(
        child=serializers.SlugField(),
        required=False,
        allow_empty=False,
    )
    provider = serializers.ChoiceField(
        choices=[
            ModelImageDeployment.PROVIDER_LOCAL_DOCKER,
            ModelImageDeployment.PROVIDER_KUBERNETES,
            ModelImageDeployment.PROVIDER_AWS_ECS,
            ModelImageDeployment.PROVIDER_GCP_CLOUD_RUN,
        ],
        default=ModelImageDeployment.PROVIDER_LOCAL_DOCKER,
    )
    public_host = serializers.URLField(default="http://localhost")
    host_base_port = serializers.IntegerField(default=8100, min_value=1, max_value=65535)


class DeploymentCreateSerializer(DeploymentPlanRequestSerializer):
    pass


class ComposeSpecRequestSerializer(serializers.Serializer):
    deployment_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )
    project_name = serializers.SlugField(default="sabhuku-llm")


class ModelImageDeploymentSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    model_image = ModelImageSerializer(read_only=True)

    class Meta:
        model = ModelImageDeployment
        fields = [
            "id",
            "owner",
            "model_image",
            "provider",
            "status",
            "service_name",
            "host_port",
            "public_host",
            "runtime",
            "routes",
            "provider_resource_id",
            "quota",
            "billing",
            "iam",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
