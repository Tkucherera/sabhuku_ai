from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import ModelViewSet, DatasetViewSet
from .views import ModelViewSet, DatasetViewSet, ProfileView

router = DefaultRouter()
router.register(r"models", ModelViewSet)
router.register(r"datasets", DatasetViewSet)

urlpatterns = router.urls + [
    path("profile/", ProfileView.as_view(), name="profile"),
    ]