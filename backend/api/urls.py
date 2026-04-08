from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import ModelViewSet, DatasetViewSet

router = DefaultRouter()
router.register(r"models", ModelViewSet)
router.register(r"datasets", DatasetViewSet)

urlpatterns = router.urls