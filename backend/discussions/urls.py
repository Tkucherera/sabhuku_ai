from django.urls import path

from .views import (
    DatasetDiscussionListCreateView,
    ModelDiscussionListCreateView,
    TutorialDiscussionListCreateView,
)


urlpatterns = [
    path("datasets/<int:dataset_id>/", DatasetDiscussionListCreateView.as_view(), name="dataset-discussions"),
    path("models/<int:model_id>/", ModelDiscussionListCreateView.as_view(), name="model-discussions"),
    path("tutorials/<int:tutorial_id>/", TutorialDiscussionListCreateView.as_view(), name="tutorial-discussions"),
]
