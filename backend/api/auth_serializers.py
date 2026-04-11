from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import OperationalError, ProgrammingError
from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import LoginSerializer, PasswordResetSerializer
from rest_framework import serializers
from django.utils.text import slugify

from .models import UserProfile
from .utils import custom_password_reset_url_generator

User = get_user_model()


class CustomLoginSerializer(LoginSerializer):
    def get_auth_user(self, username, email, password):
        resolved_username = (username or "").strip()
        resolved_email = (email or "").strip()

        if resolved_email:
            matching_email_user = User.objects.filter(email__iexact=resolved_email).first()
            if matching_email_user:
                resolved_username = matching_email_user.get_username()
                resolved_email = ""

        if resolved_username:
            try:
                matching_profile_user = User.objects.filter(
                    profile__public_username__iexact=resolved_username
                ).first()
            except (ProgrammingError, OperationalError):
                matching_profile_user = None

            if matching_profile_user:
                resolved_username = matching_profile_user.get_username()
                resolved_email = ""
            elif "@" in resolved_username:
                matching_email_user = User.objects.filter(email__iexact=resolved_username).first()
                if matching_email_user:
                    resolved_username = matching_email_user.get_username()
                    resolved_email = ""

        return super().get_auth_user(resolved_username, resolved_email, password)


class CustomRegisterSerializer(RegisterSerializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    public_username = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data["first_name"] = self.validated_data.get("first_name", "")
        data["last_name"] = self.validated_data.get("last_name", "")
        data["public_username"] = self.validated_data.get("public_username", "")
        return data

    def validate_public_username(self, value):
        cleaned_value = slugify(value.strip())
        if not cleaned_value:
            raise serializers.ValidationError("Choose a public username.")
        try:
            username_exists = UserProfile.objects.filter(public_username=cleaned_value).exists()
        except (ProgrammingError, OperationalError):
            username_exists = False
        if username_exists:
            raise serializers.ValidationError("This public username is already taken.")
        return cleaned_value

    def custom_signup(self, request, user):
        user.first_name = self.validated_data.get("first_name", "").strip()
        user.last_name = self.validated_data.get("last_name", "").strip()
        user.save(update_fields=["first_name", "last_name"])
        profile = user.profile
        requested_public_username = self.validated_data.get("public_username", "").strip()
        if requested_public_username:
            profile.public_username = requested_public_username
            profile.save(update_fields=["public_username"])


class CustomPasswordResetSerializer(PasswordResetSerializer):
    def get_email_options(self):
        return {
            'url_generator': custom_password_reset_url_generator,
            'from_email': getattr(settings, 'DEFAULT_FROM_EMAIL'),
        }
