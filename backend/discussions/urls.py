from django.urls import path

from .views import DatasetDiscussionListCreateView, TutorialDiscussionListCreateView


urlpatterns = [
    path("datasets/<int:dataset_id>/", DatasetDiscussionListCreateView.as_view(), name="dataset-discussions"),
    path("tutorials/<int:tutorial_id>/", TutorialDiscussionListCreateView.as_view(), name="tutorial-discussions"),
]
