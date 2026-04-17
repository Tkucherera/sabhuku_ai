from django.urls import path

from .views import model_profile_detail, recommend_hardware


urlpatterns = [
    path("recommend/", recommend_hardware, name="hardware-recommend"),
    path("profiles/<int:profile_id>/", model_profile_detail, name="hardware-profile-detail"),
]
