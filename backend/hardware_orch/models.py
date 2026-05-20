from django.db import models
from django.conf import settings


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


class ModelImage(models.Model):
    slug = models.SlugField(max_length=120, unique=True)
    name = models.CharField(max_length=255)
    family = models.CharField(max_length=64, default="llm")
    image = models.CharField(max_length=512)
    context = models.CharField(max_length=512)
    dockerfile = models.CharField(max_length=512)
    internal_port = models.PositiveIntegerField(default=8000)
    health_path = models.CharField(max_length=255, default="/health")
    env = models.JSONField(default=dict, blank=True)
    endpoints = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["slug"]

    def __str__(self):
        return self.slug


class ModelImageDeployment(models.Model):
    STATUS_PLANNED = "planned"
    STATUS_DEPLOYING = "deploying"
    STATUS_RUNNING = "running"
    STATUS_DESTROYING = "destroying"
    STATUS_DESTROYED = "destroyed"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_PLANNED, "Planned"),
        (STATUS_DEPLOYING, "Deploying"),
        (STATUS_RUNNING, "Running"),
        (STATUS_DESTROYING, "Destroying"),
        (STATUS_DESTROYED, "Destroyed"),
        (STATUS_FAILED, "Failed"),
    ]

    PROVIDER_LOCAL_DOCKER = "local-docker"
    PROVIDER_KUBERNETES = "kubernetes"
    PROVIDER_AWS_ECS = "aws-ecs"
    PROVIDER_GCP_CLOUD_RUN = "gcp-cloud-run"
    PROVIDER_CHOICES = [
        (PROVIDER_LOCAL_DOCKER, "Local Docker"),
        (PROVIDER_KUBERNETES, "Kubernetes"),
        (PROVIDER_AWS_ECS, "AWS ECS"),
        (PROVIDER_GCP_CLOUD_RUN, "GCP Cloud Run"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="model_image_deployments",
        on_delete=models.CASCADE,
    )
    model_image = models.ForeignKey(
        ModelImage,
        related_name="deployments",
        on_delete=models.PROTECT,
    )
    provider = models.CharField(
        max_length=32,
        choices=PROVIDER_CHOICES,
        default=PROVIDER_LOCAL_DOCKER,
    )
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_PLANNED)
    service_name = models.CharField(max_length=255)
    host_port = models.PositiveIntegerField(null=True, blank=True)
    public_host = models.CharField(max_length=512, default="http://localhost")
    runtime = models.JSONField(default=dict, blank=True)
    routes = models.JSONField(default=list, blank=True)
    provider_resource_id = models.CharField(max_length=512, blank=True)
    quota = models.JSONField(default=dict, blank=True)
    billing = models.JSONField(default=dict, blank=True)
    iam = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "status"]),
            models.Index(fields=["provider", "status"]),
            models.Index(fields=["host_port"]),
        ]

    def __str__(self):
        return f"{self.owner_id}:{self.model_image.slug}:{self.status}"
