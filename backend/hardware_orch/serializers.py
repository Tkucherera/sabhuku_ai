from pathlib import Path
from urllib.parse import urlparse

from django.conf import settings
from rest_framework import serializers

from .models import HardwareProfile, ModelProfile


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
