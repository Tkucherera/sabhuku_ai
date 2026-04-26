import os
import uuid
from datetime import timedelta
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth.models import User
from django.http import Http404
from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import generics, permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from google.cloud import storage

from .models import Model, Dataset, UserProfile
from .serializers import ModelSerializer, DatasetSerializer, UserProfileSerializer
from tutorials.models import Tutorial
from tutorials.serializers import TutorialSerializer


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
    serializer_class = ModelSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Model.objects.select_related("author", "author__profile").all().order_by("-id")
        params = self.request.query_params
        query = (params.get("q") or "").strip()
        category = (params.get("category") or "").strip()
        author = (params.get("author") or "").strip()
        tag = (params.get("tag") or "").strip()
        trending = (params.get("trending") or "").strip().lower()

        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(description__icontains=query)
                | Q(category__icontains=query)
                | Q(tags__icontains=query)
            )
        if category:
            queryset = queryset.filter(category__iexact=category)
        if author:
            queryset = queryset.filter(
                Q(author__profile__public_username__iexact=author) | Q(author__username__iexact=author)
            )
        if tag:
            queryset = queryset.filter(tags__icontains=tag)
        if trending in {"true", "1", "yes"}:
            queryset = queryset.filter(trending=True)
        return queryset

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
    serializer_class = DatasetSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Dataset.objects.select_related("author", "author__profile").prefetch_related(
            "dataset_discussions__user",
            "dataset_discussions__user__profile",
        ).all().order_by("-id")
        user = self.request.user
        params = self.request.query_params
        query = (params.get("q") or "").strip()
        category = (params.get("category") or "").strip()
        author = (params.get("author") or "").strip()
        tag = (params.get("tag") or "").strip()
        mine = (params.get("mine") or "").strip().lower() in {"true", "1", "yes"}

        if mine and user.is_authenticated:
            queryset = queryset.filter(author=user)
        elif user.is_authenticated:
            queryset = queryset.filter(Q(is_public=True) | Q(author=user))
        else:
            queryset = queryset.filter(is_public=True)

        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(subtitle__icontains=query)
                | Q(description__icontains=query)
                | Q(category__icontains=query)
                | Q(tags__icontains=query)
                | Q(authors__icontains=query)
                | Q(source__icontains=query)
            )
        if category:
            queryset = queryset.filter(category__iexact=category)
        if author:
            queryset = queryset.filter(
                Q(author__profile__public_username__iexact=author) | Q(author__username__iexact=author)
            )
        if tag:
            queryset = queryset.filter(tags__icontains=tag)
        return queryset

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


class CommunityOverviewView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        published_tutorials = Tutorial.objects.filter(status=Tutorial.STATUS_PUBLISHED)
        public_datasets = Dataset.objects.select_related("author", "author__profile").filter(is_public=True)
        models = Model.objects.select_related("author", "author__profile").all()

        return Response(
            {
                "stats": {
                    "members": User.objects.count(),
                    "models": models.count(),
                    "datasets": public_datasets.count(),
                    "tutorials": published_tutorials.count(),
                },
                "featured_models": ModelSerializer(
                    models.order_by("-trending", "-downloads", "-likes", "-id")[:5], many=True
                ).data,
                "featured_datasets": DatasetSerializer(
                    public_datasets.order_by("-downloads", "-id")[:5], many=True
                ).data,
                "featured_tutorials": TutorialSerializer(
                    published_tutorials.select_related("author", "author__profile").prefetch_related("tags").order_by(
                        "-published_at", "-updated_at", "-id"
                    )[:5],
                    many=True,
                ).data,
            }
        )


class CommunitySearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = (request.query_params.get("q") or "").strip()
        search_type = (request.query_params.get("type") or "all").strip().lower()
        try:
            limit = max(1, min(int(request.query_params.get("limit", 5)), 20))
        except (TypeError, ValueError):
            limit = 5

        if not query:
            return Response(
                {
                    "query": "",
                    "results": {"models": [], "datasets": [], "tutorials": []},
                }
            )

        include_models = search_type in {"all", "models"}
        include_datasets = search_type in {"all", "datasets"}
        include_tutorials = search_type in {"all", "tutorials"}

        model_results = []
        dataset_results = []
        tutorial_results = []

        if include_models:
            model_results = ModelSerializer(
                Model.objects.select_related("author", "author__profile")
                .filter(
                    Q(name__icontains=query)
                    | Q(description__icontains=query)
                    | Q(category__icontains=query)
                    | Q(tags__icontains=query)
                )
                .order_by("-trending", "-downloads", "-likes", "-id")[:limit],
                many=True,
            ).data

        if include_datasets:
            dataset_results = DatasetSerializer(
                Dataset.objects.select_related("author", "author__profile")
                .filter(is_public=True)
                .filter(
                    Q(name__icontains=query)
                    | Q(subtitle__icontains=query)
                    | Q(description__icontains=query)
                    | Q(category__icontains=query)
                    | Q(tags__icontains=query)
                    | Q(authors__icontains=query)
                    | Q(source__icontains=query)
                )
                .order_by("-downloads", "-id")[:limit],
                many=True,
                context={"request": request},
            ).data

        if include_tutorials:
            tutorial_results = TutorialSerializer(
                Tutorial.objects.select_related("author", "author__profile")
                .prefetch_related("tags")
                .filter(status=Tutorial.STATUS_PUBLISHED)
                .filter(
                    Q(title__icontains=query)
                    | Q(excerpt__icontains=query)
                    | Q(body_markdown__icontains=query)
                    | Q(seo_keywords__icontains=query)
                    | Q(tags__name__icontains=query)
                )
                .distinct()
                .order_by("-published_at", "-updated_at", "-id")[:limit],
                many=True,
            ).data

        return Response(
            {
                "query": query,
                "type": search_type,
                "limit": limit,
                "results": {
                    "models": model_results,
                    "datasets": dataset_results,
                    "tutorials": tutorial_results,
                },
            }
        )
