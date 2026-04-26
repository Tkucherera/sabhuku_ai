from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import (
    CommunityOverviewView,
    CommunitySearchView,
    DashboardView,
    DatasetViewSet,
    ModelViewSet,
    ProfileUploadUrlView,
    ProfileView,
)

router = DefaultRouter()
router.register(r"models", ModelViewSet, basename="model")
router.register(r"datasets", DatasetViewSet, basename="dataset")

urlpatterns = router.urls + [
    path("community/overview/", CommunityOverviewView.as_view(), name="community-overview"),
    path("community/search/", CommunitySearchView.as_view(), name="community-search"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("profile/upload-url/", ProfileUploadUrlView.as_view(), name="profile-upload-url"),
]
