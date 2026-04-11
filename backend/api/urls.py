from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import DashboardView, ModelViewSet, DatasetViewSet, ProfileUploadUrlView, ProfileView

router = DefaultRouter()
router.register(r"models", ModelViewSet)
router.register(r"datasets", DatasetViewSet)

urlpatterns = router.urls + [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("profile/upload-url/", ProfileUploadUrlView.as_view(), name="profile-upload-url"),
]
