from django.http import Http404
from rest_framework import generics, permissions

from api.models import Dataset

from .models import Discussion
from .serializers import DiscussionSerializer


def _get_visible_dataset(request, dataset_id):
    dataset = Dataset.objects.select_related("author", "author__profile").filter(pk=dataset_id).first()
    if not dataset:
        raise Http404

    if dataset.is_public or dataset.author == request.user:
        return dataset

    raise Http404


class DatasetDiscussionListCreateView(generics.ListCreateAPIView):
    serializer_class = DiscussionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_dataset(self):
        return _get_visible_dataset(self.request, self.kwargs["dataset_id"])

    def get_queryset(self):
        dataset = self.get_dataset()
        return Discussion.objects.select_related("user", "user__profile").filter(
            dataset=dataset,
            parent__isnull=True,
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["dataset"] = self.get_dataset()
        return context

    def perform_create(self, serializer):
        dataset = self.get_dataset()
        serializer.save(user=self.request.user, dataset=dataset)
