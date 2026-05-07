from urllib.parse import urlparse

from django.conf import settings
from dj_rest_auth.registration.serializers import SocialLoginSerializer
from rest_framework import serializers


class SocialCodeLoginSerializer(SocialLoginSerializer):
    callback_url = serializers.URLField(write_only=True)

    def set_callback_url(self, view, adapter_class):
        callback_url = self.initial_data.get("callback_url")
        parsed_callback = urlparse(callback_url)
        callback_origin = f"{parsed_callback.scheme}://{parsed_callback.netloc}"
        allowed_origins = {
            origin.rstrip("/")
            for origin in getattr(settings, "SOCIAL_AUTH_ALLOWED_REDIRECT_ORIGINS", [])
        }

        if callback_origin not in allowed_origins:
            raise serializers.ValidationError("Social login callback origin is not allowed.")

        self.callback_url = callback_url
