from django.contrib import admin

try:
    from unfold.admin import ModelAdmin
except ImportError:  # pragma: no cover
    from django.contrib.admin import ModelAdmin

from .models import Dataset, Model, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(ModelAdmin):
    list_display = ("user", "public_username", "title", "location")
    search_fields = ("user__username", "user__email", "public_username", "title", "location")


@admin.register(Model)
class ModelEntryAdmin(ModelAdmin):
    list_display = ("name", "author", "category", "downloads", "likes", "trending")
    list_filter = ("category", "trending")
    search_fields = ("name", "author__username", "description", "license")


@admin.register(Dataset)
class DatasetAdmin(ModelAdmin):
    list_display = ("name", "author", "category", "downloads", "is_public", "slug")
    list_filter = ("category", "is_public")
    search_fields = ("name", "author__username", "description", "slug", "license")
