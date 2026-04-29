import math
import re
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify


def _build_unique_slug(model, value, *, exclude_id=None, fallback="community-tutorial", max_length=220):
    base_slug = slugify(value or "")[:max_length].strip("-") or fallback
    candidate = base_slug
    suffix = 1

    while model.objects.exclude(pk=exclude_id).filter(slug=candidate).exists():
        candidate = f"{base_slug[: max_length - 12]}-{suffix}"
        suffix += 1

    return candidate


def normalize_tag_names(tag_names):
    normalized = []
    seen = set()
    for raw_name in tag_names or []:
        name = str(raw_name or "").strip()
        if not name:
            continue
        folded = name.lower()
        if folded in seen:
            continue
        seen.add(folded)
        normalized.append(name[:80])
    return normalized[:12]


def estimate_read_time(markdown_text):
    words = len(re.findall(r"\w+", markdown_text or ""))
    return max(1, math.ceil(words / 220))


class TutorialTag(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _build_unique_slug(TutorialTag, self.name, exclude_id=self.pk, fallback="topic", max_length=110)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Tutorial(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_PUBLISHED = "published"
    STATUS_ARCHIVED = "archived"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_PUBLISHED, "Published"),
        (STATUS_ARCHIVED, "Archived"),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tutorials")
    excerpt = models.TextField(blank=True, default="")
    body_markdown = models.TextField()
    make_audio = models.BooleanField(default=False)
    audio_status = models.CharField(max_length=20, choices=[("pending", "Pending"), ("processing", "Processing"), ("ready", "Ready"), ("failed", "Failed")], default="pending")
    audio_url = models.URLField(blank=True, null=True, default="")
    cover_image_path = models.CharField(max_length=1024, blank=True, default="")
    cover_image_url = models.URLField(blank=True, default="")
    cover_image_alt = models.CharField(max_length=255, blank=True, default="")
    thumbnail_image_path = models.CharField(max_length=1024, blank=True, default="")
    thumbnail_image_url = models.URLField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    tags = models.ManyToManyField(TutorialTag, blank=True, related_name="tutorials")
    auto_tags = models.JSONField(default=list, blank=True)
    seo_title = models.CharField(max_length=70, blank=True, default="")
    meta_description = models.CharField(max_length=160, blank=True, default="")
    seo_keywords = models.CharField(max_length=255, blank=True, default="")
    revision_number = models.PositiveIntegerField(default=1)
    read_time_minutes = models.PositiveIntegerField(default=1)
    published_at = models.DateTimeField(blank=True, null=True)
    last_revised_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-updated_at", "-id"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _build_unique_slug(Tutorial, self.title, exclude_id=self.pk, fallback="community-tutorial", max_length=220)

        self.read_time_minutes = estimate_read_time(self.body_markdown)

        if not self.excerpt:
            plain = re.sub(r"[#>*_`-]", " ", self.body_markdown or "")
            self.excerpt = " ".join(plain.split())[:220]

        if not self.seo_title:
            self.seo_title = self.title[:70]

        if not self.meta_description:
            self.meta_description = (self.excerpt or self.title)[:160]

        if not self.cover_image_alt:
            self.cover_image_alt = self.title

        if self.pk:
            previous = Tutorial.objects.filter(pk=self.pk).values(
                "title",
                "excerpt",
                "body_markdown",
                "cover_image_path",
                "cover_image_url",
                "thumbnail_image_path",
                "thumbnail_image_url",
                "status",
            ).first()
            if previous and any(previous[field] != getattr(self, field) for field in previous):
                self.revision_number += 1
                self.last_revised_at = timezone.now()
        else:
            self.last_revised_at = timezone.now()

        if self.status == self.STATUS_PUBLISHED and not self.published_at:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)

        inferred = self.build_auto_tags()
        if inferred != self.auto_tags:
            self.auto_tags = inferred
            super().save(update_fields=["auto_tags"])

    def build_auto_tags(self):
        text = " ".join(
            [
                self.title or "",
                self.excerpt or "",
                self.body_markdown or "",
                self.seo_keywords or "",
            ]
        ).lower()
        keyword_map = {
            "llm": ["llm", "gpt", "prompt"],
            "rag": ["rag", "retrieval augmented generation", "vector search"],
            "fine-tuning": ["fine-tuning", "finetuning", "fine tune"],
            "datasets": ["dataset", "datasets", "annotation"],
            "computer vision": ["computer vision", "image classification", "detection"],
            "nlp": ["nlp", "natural language", "embedding"],
            "inference": ["inference", "serving", "latency"],
            "evaluation": ["evaluation", "benchmark", "metrics"],
            "python": ["python", "pip", "venv"],
            "django": ["django", "drf"],
            "react": ["react", "vite", "typescript"],
            "api": ["api", "endpoint", "rest"],
            "africa": ["africa", "african", "zimbabwe", "sadc"],
        }
        matches = [label for label, phrases in keyword_map.items() if any(phrase in text for phrase in phrases)]
        manual_tags = [tag.name for tag in self.tags.all()]
        return normalize_tag_names([*manual_tags, *matches])[:8]

    @property
    def public_tags(self):
        return normalize_tag_names([*(tag.name for tag in self.tags.all()), *(self.auto_tags or [])])

    @property
    def absolute_url(self):
        return reverse("tutorials:detail", kwargs={"slug": self.slug})

    @property
    def cover_storage_url(self):
        if self.cover_image_path and getattr(settings, "GS_MEDIA_BUCKET_NAME", ""):
            return f"https://storage.googleapis.com/{settings.GS_MEDIA_BUCKET_NAME}/{quote(self.cover_image_path, safe='/')}"
        return self.cover_image_url

    @property
    def thumbnail_storage_url(self):
        if self.thumbnail_image_path and getattr(settings, "GS_MEDIA_BUCKET_NAME", ""):
            return f"https://storage.googleapis.com/{settings.GS_MEDIA_BUCKET_NAME}/{quote(self.thumbnail_image_path, safe='/')}"
        return self.thumbnail_image_url or self.cover_storage_url
