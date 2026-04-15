from rest_framework import serializers

from .models import Discussion


class DiscussionSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="user.username", read_only=True)
    author_public_username = serializers.CharField(source="user.profile.public_username", read_only=True)
    author_display_name = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Discussion
        fields = [
            "id",
            "content",
            "created_at",
            "parent",
            "dataset",
            "model",
            "author_username",
            "author_public_username",
            "author_display_name",
            "replies",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "model",
            "author_username",
            "author_public_username",
            "author_display_name",
            "replies",
        ]

    def get_author_display_name(self, obj):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name or obj.user.username

    def get_replies(self, obj):
        replies = obj.replies.select_related("user", "user__profile").all().order_by("created_at")
        return DiscussionSerializer(replies, many=True, context=self.context).data

    def validate_content(self, value):
        cleaned_value = value.strip()
        if not cleaned_value:
            raise serializers.ValidationError("content cannot be blank")
        return cleaned_value

    def validate(self, attrs):
        dataset = self.context.get("dataset")
        parent = attrs.get("parent")

        if parent and dataset and parent.dataset_id != dataset.id:
            raise serializers.ValidationError({"parent": "reply must belong to the same dataset"})

        return attrs
