from django.db import models


class ModelProfile(models.Model):
    SOURCE_KIND_URL = "url"
    SOURCE_KIND_PATH = "path"
    SOURCE_KIND_CHOICES = [
        (SOURCE_KIND_URL, "URL"),
        (SOURCE_KIND_PATH, "Local path"),
    ]

    PREFER_COST = "cost"
    PREFER_LATENCY = "latency"
    PREFER_BALANCED = "balanced"
    PREFERENCE_CHOICES = [
        (PREFER_COST, "Cost"),
        (PREFER_LATENCY, "Latency"),
        (PREFER_BALANCED, "Balanced"),
    ]

    model_name = models.CharField(max_length=255, blank=True)
    source = models.CharField(max_length=1024)
    source_kind = models.CharField(max_length=16, choices=SOURCE_KIND_CHOICES)
    preferred_optimization = models.CharField(
        max_length=16,
        choices=PREFERENCE_CHOICES,
        default=PREFER_BALANCED,
    )
    requested_providers = models.JSONField(default=list, blank=True)
    use_spot = models.BooleanField(default=False)
    allow_inferentia = models.BooleanField(default=False)
    profile_summary = models.TextField(blank=True)
    profile_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.model_name or self.source


class HardwareProfile(models.Model):
    model_profile = models.ForeignKey(
        ModelProfile,
        related_name="hardware_profiles",
        on_delete=models.CASCADE,
    )
    provider = models.CharField(max_length=32)
    instance_name = models.CharField(max_length=255)
    gpu_model = models.CharField(max_length=255, blank=True)
    gpu_count = models.PositiveIntegerField(default=0)
    total_vram_gb = models.FloatField(default=0.0)
    ram_gb = models.FloatField(default=0.0)
    score = models.FloatField(default=0.0)
    cost_per_hour = models.FloatField(default=0.0)
    vram_headroom = models.FloatField(default=0.0)
    recommendation_data = models.JSONField(default=dict, blank=True)
    deployment_config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.provider}:{self.instance_name}"
