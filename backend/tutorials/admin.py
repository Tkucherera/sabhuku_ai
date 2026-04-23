from django.contrib import admin

try:
    from unfold.admin import ModelAdmin
except ImportError:  # pragma: no cover
    from django.contrib.admin import ModelAdmin

from .models import Tutorial, TutorialTag


@admin.register(TutorialTag)
class TutorialTagAdmin(ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name", "slug")


@admin.register(Tutorial)
class TutorialAdmin(ModelAdmin):
    list_display = ("title", "author", "status", "published_at", "revision_number", "read_time_minutes")
    list_filter = ("status", "tags")
    search_fields = ("title", "excerpt", "body_markdown", "seo_keywords", "slug")
    autocomplete_fields = ("author", "tags")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("revision_number", "read_time_minutes", "created_at", "updated_at", "last_revised_at")

