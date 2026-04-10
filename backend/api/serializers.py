from rest_framework import serializers
from django.utils import timezone
from .models import Model, Dataset, UserProfile


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

    def create(self, validated_data):
        validated_data.setdefault("updated", timezone.now().isoformat())
        validated_data.setdefault("license", "Custom")
        return super().create(validated_data)


class DatasetSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Dataset
        fields = [
            "id",
            "name",
            "author",
            "author_username",
            "description",
            "category",
            "size",
            "downloads",
            "format",
            "updated",
            "file_path",
            "license",
        ]
        read_only_fields = ["id", "author", "author_username", "downloads", "updated"]
        extra_kwargs = {
            "description": {"required": False, "allow_blank": True},
            "license": {"required": False, "allow_blank": True},
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

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "email",
            "date_joined",
            "first_name",
            "last_name",
            "bio",
            "location",
            "title",
            "avatar_url",
            "cover_image_url",
            "twitter",
            "linkedin",
            "github",
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
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
