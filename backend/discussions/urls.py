from django.urls import path

from .views import DatasetDiscussionListCreateView


urlpatterns = [
    path("datasets/<int:dataset_id>/", DatasetDiscussionListCreateView.as_view(), name="dataset-discussions"),
]
