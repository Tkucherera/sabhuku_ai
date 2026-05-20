from django.urls import path

from .views import (
    control_plane_compose_spec,
    control_plane_deployment_detail,
    control_plane_deployment_plan,
    control_plane_deployments,
    control_plane_destroy_deployment,
    control_plane_images,
    model_profile_detail,
    recommend_hardware,
)


urlpatterns = [
    path("recommend/", recommend_hardware, name="hardware-recommend"),
    path("profiles/<int:profile_id>/", model_profile_detail, name="hardware-profile-detail"),
    path("control-plane/images/", control_plane_images, name="control-plane-images"),
    path("control-plane/deployments/plan/", control_plane_deployment_plan, name="control-plane-deployment-plan"),
    path("control-plane/deployments/", control_plane_deployments, name="control-plane-deployments"),
    path(
        "control-plane/deployments/<int:deployment_id>/",
        control_plane_deployment_detail,
        name="control-plane-deployment-detail",
    ),
    path(
        "control-plane/deployments/<int:deployment_id>/destroy/",
        control_plane_destroy_deployment,
        name="control-plane-destroy-deployment",
    ),
    path("control-plane/compose/", control_plane_compose_spec, name="control-plane-compose"),
]
