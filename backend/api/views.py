import os
import uuid
from datetime import timedelta
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth.models import User
from django.http import Http404
from django.db.models import Sum
from django.utils import timezone
from rest_framework import generics, permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from google.cloud import storage

from .models import Model, Dataset, UserProfile
from .serializers import ModelSerializer, DatasetSerializer, UserProfileSerializer


class SignedUploadRequestSerializer(serializers.Serializer):
    filename = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=255, required=False, allow_blank=True)


def _storage_bucket():
    client = storage.Client()
    return client.bucket(settings.GS_BUCKET_NAME)


def _build_blob_path(prefix, user_id, filename):
    safe_name = os.path.basename(filename).strip()
    if not safe_name:
        raise serializers.ValidationError({"filename": "filename is required"})
    return f"{prefix}/{user_id}/{uuid.uuid4()}_{safe_name}"


def _build_signed_upload(prefix, request):
    serializer = SignedUploadRequestSerializer(data=request.data or request.query_params)
    serializer.is_valid(raise_exception=True)

    blob_path = _build_blob_path(prefix, request.user.id, serializer.validated_data["filename"])
    content_type = serializer.validated_data.get("content_type") or "application/octet-stream"
    blob = _storage_bucket().blob(blob_path)

    upload_url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=settings.GS_UPLOAD_URL_EXPIRATION_MINUTES),
        method="PUT",
        content_type=content_type,
    )
    return Response(
        {
            "upload_url": upload_url,
            "file_path": blob_path,
            "file_url": f"https://storage.googleapis.com/{settings.GS_BUCKET_NAME}/{quote(blob_path, safe='/')}",
            "content_type": content_type,
            "expires_in_minutes": settings.GS_UPLOAD_URL_EXPIRATION_MINUTES,
        }
    )


def _build_signed_download(file_path):
    blob = _storage_bucket().blob(file_path)
    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(hours=settings.GS_DOWNLOAD_URL_EXPIRATION_HOURS),
        method="GET",
    )


class ModelViewSet(viewsets.ModelViewSet):
    queryset = Model.objects.select_related("author").all().order_by("-id")
    serializer_class = ModelSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(
        detail=False,
        methods=["post"],
        url_path="upload-url",
        permission_classes=[permissions.IsAuthenticated],
    )
    def upload_url(self, request):
        return _build_signed_upload("models", request)

    @action(
        detail=True,
        methods=["get"],
        url_path="download-url",
        permission_classes=[permissions.AllowAny],
    )
    def download_url(self, request, pk=None):
        model = self.get_object()
        model.downloads += 1
        model.updated = timezone.now().isoformat()
        model.save(update_fields=["downloads", "updated"])
        return Response({"url": _build_signed_download(model.file_path)})


class DatasetViewSet(viewsets.ModelViewSet):
    queryset = Dataset.objects.select_related("author", "author__profile").prefetch_related(
        "dataset_discussions__user",
        "dataset_discussions__user__profile",
    ).all().order_by("-id")
    serializer_class = DatasetSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(
        detail=False,
        methods=["post"],
        url_path="upload-url",
        permission_classes=[permissions.IsAuthenticated],
    )
    def upload_url(self, request):
        return _build_signed_upload("datasets", request)

    @action(
        detail=True,
        methods=["get"],
        url_path="download-url",
        permission_classes=[permissions.AllowAny],
    )
    def download_url(self, request, pk=None):
        dataset = self.get_object()
        dataset.downloads += 1
        dataset.updated = timezone.now().isoformat()
        dataset.save(update_fields=["downloads", "updated"])
        return Response({"url": _build_signed_download(dataset.file_path)})

    @action(
        detail=False,
        methods=["get"],
        url_path=r"by-owner/(?P<public_username>[^/]+)/(?P<dataset_slug>[^/]+)",
        permission_classes=[permissions.AllowAny],
    )
    def by_owner(self, request, public_username=None, dataset_slug=None):
        queryset = self.get_queryset()
        dataset = queryset.filter(
            author__profile__public_username=public_username,
            slug=dataset_slug,
        ).first()

        if not dataset:
            raise Http404

        if not dataset.is_public and dataset.author != request.user:
            raise Http404

        serializer = self.get_serializer(dataset)
        return Response(serializer.data)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
 
    def get_object(self):
        # auto-create profile if somehow missing
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        if not profile.public_username:
            profile.save(update_fields=["public_username"])
        return profile


class ProfileUploadUrlView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return _build_signed_upload("profiles", request)


class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if not profile.public_username:
            profile.save(update_fields=["public_username"])

        user_models = Model.objects.filter(author=user).order_by("-id")
        user_datasets = Dataset.objects.filter(author=user).order_by("-id")
        trending_models = Model.objects.select_related("author").order_by(
            "-trending", "-downloads", "-likes", "-id"
        )[:3]
        popular_datasets = Dataset.objects.select_related("author", "author__profile").filter(
            is_public=True
        ).order_by("-downloads", "-id")[:3]

        total_model_downloads = user_models.aggregate(total=Sum("downloads"))["total"] or 0
        total_dataset_downloads = user_datasets.aggregate(total=Sum("downloads"))["total"] or 0

        return Response(
            {
                "user": {
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "public_username": profile.public_username,
                    "avatar_url": _build_signed_download(profile.avatar_path) if profile.avatar_path else profile.avatar_url,
                },
                "stats": {
                    "your_models": user_models.count(),
                    "your_datasets": user_datasets.count(),
                    "total_downloads": total_model_downloads + total_dataset_downloads,
                    "community_members": User.objects.count(),
                    "community_models": Model.objects.count(),
                    "community_datasets": Dataset.objects.count(),
                },
                "trending_models": ModelSerializer(trending_models, many=True).data,
                "popular_datasets": DatasetSerializer(popular_datasets, many=True).data,
                "recent_user_models": ModelSerializer(user_models[:3], many=True).data,
                "recent_user_datasets": DatasetSerializer(user_datasets[:3], many=True).data,
            }
        )
