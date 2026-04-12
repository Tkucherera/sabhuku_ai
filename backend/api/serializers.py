from datetime import timedelta

from django.conf import settings
from django.utils.html import strip_tags
from rest_framework import serializers
from django.utils import timezone
from django.utils.text import slugify
from google.cloud import storage

from .models import Model, Dataset, UserProfile


def _build_signed_media_url(file_path):
    if not file_path:
        return ""

    client = storage.Client()
    blob = client.bucket(settings.GS_BUCKET_NAME).blob(file_path)
    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(hours=settings.GS_DOWNLOAD_URL_EXPIRATION_HOURS),
        method="GET",
    )


def _normalize_rich_text(value):
    if not isinstance(value, str):
        raise serializers.ValidationError("description must be a string")

    if not value:
        return ""

    # Preserve allowed markup, but collapse markup-only/whitespace-only input to empty.
    plain_text = strip_tags(value).replace("\xa0", " ").strip()
    return value if plain_text else ""


class ModelSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Model
        fields = [
            "id",
            "name",
            "author",
            "author_username",
            "description",
            "category",
            "downloads",
            "likes",
            "trending",
            "tags",
            "updated",
            "file_path",
            "license",
        ]
        read_only_fields = ["id", "author", "author_username", "downloads", "likes", "trending", "updated"]
        extra_kwargs = {
            "description": {"required": False, "allow_blank": True},
            "license": {"required": False, "allow_blank": True},
        }

    def validate_tags(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("tags must be a list of strings")
        cleaned_tags = []
        for tag in value:
            if not isinstance(tag, str):
                raise serializers.ValidationError("each tag must be a string")
            tag_value = tag.strip()
            if tag_value:
                cleaned_tags.append(tag_value)
        return cleaned_tags

    def validate_description(self, value):
        return _normalize_rich_text(value)

    def create(self, validated_data):
        validated_data.setdefault("updated", timezone.now().isoformat())
        validated_data.setdefault("license", "Custom")
        return super().create(validated_data)


class DatasetSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    author_public_username = serializers.CharField(source="author.profile.public_username", read_only=True)

    class Meta:
        model = Dataset
        fields = [
            "id",
            "name",
            "slug",
            "author",
            "author_username",
            "author_public_username",
            "subtitle",
            "description",
            "category",
            "size",
            "downloads",
            "format",
            "tags",
            "updated",
            "file_path",
            "license",
            "dataset_thumbnail",
            "is_public",
            "coverage_start_date",
            "coverage_end_date",
            "authors",
            "source",
            "usability_score",
        ]
        read_only_fields = ["id", "slug", "author", "author_username", "author_public_username", "downloads", "updated", "usability_score"]
        extra_kwargs = {
            "subtitle": {"required": False, "allow_blank": True},
            "description": {"required": False, "allow_blank": True},
            "license": {"required": False, "allow_blank": True},
            "dataset_thumbnail": {"required": False, "allow_blank": True},
            "authors": {"required": False, "allow_blank": True},
            "source": {"required": False, "allow_blank": True},
        }

    def validate_format(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("format must be a list of strings")
        cleaned_formats = []
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError("each format entry must be a string")
            item_value = item.strip()
            if item_value:
                cleaned_formats.append(item_value)
        return cleaned_formats

    def validate_tags(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("tags must be a list of strings")
        cleaned_tags = []
        for tag in value:
            if not isinstance(tag, str):
                raise serializers.ValidationError("each tag must be a string")
            tag_value = tag.strip()
            if tag_value:
                cleaned_tags.append(tag_value)
        return cleaned_tags

    def validate_description(self, value):
        return _normalize_rich_text(value)

    def create(self, validated_data):
        validated_data.setdefault("updated", timezone.now().isoformat())
        validated_data.setdefault("license", "Custom")
        return super().create(validated_data)

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    date_joined = serializers.DateTimeField(source="user.date_joined", read_only=True)
    first_name = serializers.CharField(source="user.first_name", required=False, allow_blank=True)
    last_name = serializers.CharField(source="user.last_name", required=False, allow_blank=True)
    public_username = serializers.CharField(required=False, allow_blank=False, allow_null=True, max_length=50)
    avatar_path = serializers.CharField(required=False, allow_blank=True, write_only=True)
    cover_image_path = serializers.CharField(required=False, allow_blank=True, write_only=True)
    avatar_url = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "public_username",
            "email",
            "date_joined",
            "first_name",
            "last_name",
            "bio",
            "location",
            "title",
            "avatar_path",
            "avatar_url",
            "cover_image_path",
            "cover_image_url",
            "twitter",
            "linkedin",
            "github",
        ]

    def get_avatar_url(self, obj):
        return _build_signed_media_url(obj.avatar_path) if obj.avatar_path else obj.avatar_url

    def get_cover_image_url(self, obj):
        return _build_signed_media_url(obj.cover_image_path) if obj.cover_image_path else obj.cover_image_url

    def validate_public_username(self, value):
        cleaned_value = slugify(value.strip())
        if not cleaned_value:
            raise serializers.ValidationError("public_username cannot be blank")

        existing_profile = UserProfile.objects.exclude(pk=self.instance.pk if self.instance else None).filter(
            public_username=cleaned_value
        )
        if existing_profile.exists():
            raise serializers.ValidationError("public_username is already taken")
        return cleaned_value

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        avatar_path = validated_data.pop("avatar_path", None)
        cover_image_path = validated_data.pop("cover_image_path", None)
        avatar_url = validated_data.get("avatar_url")
        cover_image_url = validated_data.get("cover_image_url")

        if avatar_path is not None:
            instance.avatar_path = avatar_path
            if avatar_path:
                instance.avatar_url = ""

        if cover_image_path is not None:
            instance.cover_image_path = cover_image_path
            if cover_image_path:
                instance.cover_image_url = ""

        if avatar_url:
            instance.avatar_path = ""

        if cover_image_url:
            instance.cover_image_path = ""

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        user = instance.user
        user_changed = False
        for attr, value in user_data.items():
            if getattr(user, attr) != value:
                setattr(user, attr, value)
                user_changed = True
        if user_changed:
            user.save(update_fields=list(user_data.keys()))

        return instance
