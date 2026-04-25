from django.contrib.auth.models import User
from django.db import models

from api.models import Dataset, Model
from tutorials.models import Tutorial


class Discussion(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="discussions")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
    )
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="dataset_discussions",
    )
    model = models.ForeignKey(
        Model,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="model_discussions",
    )
    tutorial = models.ForeignKey(
        Tutorial,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="tutorial_discussions",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        target = self.dataset_id or self.model_id or self.tutorial_id or "unknown"
        return f"Discussion by {self.user.username} on {target}"
