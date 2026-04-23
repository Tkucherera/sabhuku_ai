from django.contrib import admin
try:
    from unfold.admin import ModelAdmin
except ImportError:  # pragma: no cover
    from django.contrib.admin import ModelAdmin

from .models import Discussion


@admin.register(Discussion)
class DiscussionAdmin(ModelAdmin):
    list_display = ("id", "user", "dataset", "model", "created_at")
    search_fields = ("user__username", "user__profile__public_username", "content")
    list_filter = ("created_at",)
