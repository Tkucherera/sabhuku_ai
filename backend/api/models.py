from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
 
 
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True, default="")
    location = models.CharField(max_length=255, blank=True, default="")
    title = models.CharField(max_length=255, blank=True, default="")
    twitter = models.CharField(max_length=255, blank=True, default="")
    linkedin = models.CharField(max_length=255, blank=True, default="")
    github = models.CharField(max_length=255, blank=True, default="")
 
    def __str__(self):
        return f"{self.user.username}'s profile"
 
 
# Auto-create profile when a new user registers
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
 
 
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

class Model(models.Model):
    name = models.CharField(max_length=255)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.TextField(blank=True, default="")
    category = models.CharField(max_length=255)
    downloads = models.IntegerField(default=0)
    likes = models.IntegerField(default=0)
    trending = models.BooleanField(default=False)
    tags = models.JSONField(default=list)
    updated = models.CharField(max_length=255)
    file_path = models.CharField(max_length=1024)
    license = models.CharField(max_length=255, blank=True, default="Custom")

    def __str__(self):
        return self.name


class Dataset(models.Model):
    name = models.CharField(max_length=255)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.TextField(blank=True, default="")
    category = models.CharField(max_length=255)
    size = models.CharField(max_length=255)
    downloads = models.IntegerField(default=0)
    format = models.JSONField(default=list)
    updated = models.CharField(max_length=255)
    file_path = models.CharField(max_length=1024)
    license = models.CharField(max_length=255)

    def __str__(self):
        return self.name
