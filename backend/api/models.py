from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User

class Model(models.Model):
    name = models.CharField(max_length=255)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.TextField()
    category = models.CharField(max_length=255)
    downloads = models.IntegerField(default=0)
    likes = models.IntegerField(default=0)
    trending = models.BooleanField(default=False)
    tags = models.JSONField(default=list)
    updated = models.CharField(max_length=255)


class Dataset(models.Model):
    name = models.CharField(max_length=255)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.TextField()
    category = models.CharField(max_length=255)
    size = models.CharField(max_length=255)
    downloads = models.IntegerField(default=0)
    format = models.JSONField(default=list)
    updated = models.CharField(max_length=255)
    license = models.CharField(max_length=255)
    download_link = models.URLField(max_length=200, blank=True, null=True)

