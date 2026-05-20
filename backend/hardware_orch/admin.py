from django.contrib import admin

try:
    from unfold.admin import ModelAdmin
except ImportError:  # pragma: no cover
    from django.contrib.admin import ModelAdmin

from .models import HardwareProfile, ModelImage, ModelImageDeployment, ModelProfile


@admin.register(ModelProfile)
class ModelProfileAdmin(ModelAdmin):
    list_display = ("model_name", "source_kind", "preferred_optimization", "created_at", "updated_at")
    list_filter = ("source_kind", "preferred_optimization", "created_at")
    search_fields = ("model_name", "source", "profile_summary")


@admin.register(HardwareProfile)
class HardwareProfileAdmin(ModelAdmin):
    list_display = ("model_profile", "provider", "instance_name", "gpu_model", "gpu_count", "cost_per_hour")
    list_filter = ("provider", "gpu_model", "created_at")
    search_fields = ("instance_name", "gpu_model", "provider", "model_profile__model_name")


@admin.register(ModelImage)
class ModelImageAdmin(ModelAdmin):
    list_display = ("slug", "name", "family", "image", "is_active", "updated_at")
    list_filter = ("family", "is_active", "updated_at")
    search_fields = ("slug", "name", "image", "description")


@admin.register(ModelImageDeployment)
class ModelImageDeploymentAdmin(ModelAdmin):
    list_display = ("owner", "model_image", "provider", "status", "host_port", "created_at")
    list_filter = ("provider", "status", "created_at")
    search_fields = ("owner__username", "model_image__slug", "service_name", "provider_resource_id")
