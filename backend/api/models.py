from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify


def _build_unique_public_username(base_value, *, exclude_profile_id=None):
    base_slug = slugify(base_value or "")[:40].strip("-")
    if not base_slug:
        base_slug = "user"

    candidate = base_slug
    suffix = 1

    while UserProfile.objects.exclude(pk=exclude_profile_id).filter(public_username=candidate).exists():
        candidate = f"{base_slug[:40]}-{suffix}"
        suffix += 1

    return candidate


def _build_unique_dataset_slug(base_value, *, exclude_dataset_id=None):
    base_slug = slugify(base_value or "")[:200].strip("-")
    if not base_slug:
        base_slug = "dataset"

    candidate = base_slug
    suffix = 1

    while Dataset.objects.exclude(pk=exclude_dataset_id).filter(slug=candidate).exists():
        candidate = f"{base_slug[:200]}-{suffix}"
        suffix += 1

    return candidate
 
 
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    public_username = models.CharField(max_length=50, unique=True, blank=True, null=True)
    bio = models.TextField(blank=True, default="")
    location = models.CharField(max_length=255, blank=True, default="")
    title = models.CharField(max_length=255, blank=True, default="")
    avatar_path = models.CharField(max_length=1024, blank=True, default="")
    avatar_url = models.URLField(blank=True, default="")
    cover_image_path = models.CharField(max_length=1024, blank=True, default="")
    cover_image_url = models.URLField(blank=True, default="")
    twitter = models.CharField(max_length=255, blank=True, default="")
    linkedin = models.CharField(max_length=255, blank=True, default="")
    github = models.CharField(max_length=255, blank=True, default="")
 
    def __str__(self):
        return f"{self.user.username}'s profile"

    def save(self, *args, **kwargs):
        if not self.public_username:
            base_value = self.user.first_name or self.user.username or self.user.email or "user"
            self.public_username = _build_unique_public_username(
                base_value,
                exclude_profile_id=self.pk,
            )
        super().save(*args, **kwargs)
 
 
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
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    subtitle = models.CharField(max_length=255, blank=True, default="")
    description = models.TextField(blank=True, default="")
    category = models.CharField(max_length=255)
    size = models.CharField(max_length=255)
    downloads = models.IntegerField(default=0)
    format = models.JSONField(default=list)
    tags = models.JSONField(default=list)
    updated = models.CharField(max_length=255)
    file_path = models.CharField(max_length=1024)
    license = models.CharField(max_length=255)

    dataset_thumbnail = models.CharField(max_length=1024, blank=True, default="")  # New field for dataset thumbnail URL
    # updating the dataset
    is_public = models.BooleanField(default=True)

    # metadata fields
    coverage_start_date = models.DateField(null=True, blank=True)
    coverage_end_date = models.DateField(null=True, blank=True)
    authors = models.CharField(max_length=255, blank=True, default="")
    source = models.CharField(max_length=255, blank=True, default="")

    usability_score = models.FloatField(default=0.0)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _build_unique_dataset_slug(self.name, exclude_dataset_id=self.pk)
        super().save(*args, **kwargs)

    def calculate_usability_score(self):
        # Placeholder for actual usability score calculation logic
        self.usability_score = (self.downloads * 0.5) + (self.format.count() * 0.3) + (1 if self.is_public else 0)
        self.save()

    def __str__(self):
        return self.name

# TODO add an Authors section
