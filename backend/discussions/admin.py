from django.contrib import admin

from .models import Discussion


@admin.register(Discussion)
class DiscussionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "dataset", "model", "created_at")
    search_fields = ("user__username", "user__profile__public_username", "content")
    list_filter = ("created_at",)
