from django.contrib import admin
try:
    from unfold.admin import ModelAdmin
except ImportError:  # pragma: no cover
    from django.contrib.admin import ModelAdmin

from .models import HardwareProfile, ModelProfile


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
