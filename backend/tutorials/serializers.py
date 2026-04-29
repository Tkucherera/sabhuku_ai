from rest_framework import serializers

from .models import Tutorial, TutorialTag, normalize_tag_names


class TutorialTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = TutorialTag
        fields = ("id", "name", "slug")


class TutorialSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_public_username = serializers.SerializerMethodField()
    author_avatar_url = serializers.SerializerMethodField()
    tags = TutorialTagSerializer(many=True, read_only=True)
    public_tags = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    thumbnail_image = serializers.SerializerMethodField()

    class Meta:
        model = Tutorial
        fields = (
            "id",
            "title",
            "slug",
            "excerpt",
            "body_markdown",
            "status",
            "seo_title",
            "meta_description",
            "seo_keywords",
            "revision_number",
            "read_time_minutes",
            "published_at",
            "last_revised_at",
            "updated_at",
            "author_name",
            "author_public_username",
            "author_avatar_url",
            "tags",
            "public_tags",
            "cover_image",
            "thumbnail_image",
            "cover_image_url",
            "cover_image_path",
            "cover_image_alt",
            "thumbnail_image_url",
            "thumbnail_image_path",
        )

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username

    def get_author_public_username(self, obj):
        profile = getattr(obj.author, "profile", None)
        return getattr(profile, "public_username", obj.author.username)

    def get_author_avatar_url(self, obj):
        profile = getattr(obj.author, "profile", None)
        return getattr(profile, "avatar_url", "")

    def get_public_tags(self, obj):
        return obj.public_tags

    def get_cover_image(self, obj):
        return obj.cover_storage_url

    def get_thumbnail_image(self, obj):
        return obj.thumbnail_storage_url


class TutorialWriteSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(max_length=80), required=False, write_only=True)

    class Meta:
        model = Tutorial
        fields = (
            "id",
            "title",
            "slug",
            "excerpt",
            "body_markdown",
            "status",
            "seo_title",
            "meta_description",
            "seo_keywords",
            "cover_image_url",
            "cover_image_path",
            "cover_image_alt",
            "thumbnail_image_url",
            "thumbnail_image_path",
            "tags",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        tag_names = normalize_tag_names(validated_data.pop("tags", []))
        tutorial = Tutorial.objects.create(**validated_data)
        self._sync_tags(tutorial, tag_names)
        return tutorial

    def update(self, instance, validated_data):
        tag_names = validated_data.pop("tags", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if tag_names is not None:
            self._sync_tags(instance, normalize_tag_names(tag_names))
        return instance

    def _sync_tags(self, tutorial, tag_names):
        tags = []
        for name in tag_names:
            tag, _ = TutorialTag.objects.get_or_create(name=name, defaults={"slug": ""})
            if not tag.slug:
                tag.save(update_fields=["slug"])
            tags.append(tag)
        tutorial.tags.set(tags)
        tutorial.auto_tags = tutorial.build_auto_tags()
        tutorial.save(update_fields=["auto_tags"])

class TutorialListSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_public_username = serializers.SerializerMethodField()
    author_avatar_url = serializers.SerializerMethodField()
    tags = TutorialTagSerializer(many=True, read_only=True)
    public_tags = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()

    class Meta:
        model = Tutorial
        fields = (
            "id",
            "title",
            "slug",
            "excerpt",
            "read_time_minutes",
            "published_at",
            "author_name",
            "author_public_username",
            "author_avatar_url",
            "tags",
            "public_tags",
            "cover_image",
        )

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username

    def get_author_public_username(self, obj):
        profile = getattr(obj.author, "profile", None)
        return getattr(profile, "public_username", obj.author.username)

    def get_author_avatar_url(self, obj):
        profile = getattr(obj.author, "profile", None)
        return getattr(profile, "avatar_url", "")

    def get_public_tags(self, obj):
        return obj.public_tags

    def get_cover_image(self, obj):
        return obj.cover_storage_url
    

class TutorialAudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tutorial
        fields = ["id", "title", "audio_url", "audio_status"]
        read_only_fields = fields
        
