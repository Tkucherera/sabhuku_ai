import json
import os
import re
import uuid
from datetime import timedelta
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth.models import User
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.templatetags.static import static
from django.urls import reverse
from django.utils import timezone
from markdown_it import MarkdownIt
from rest_framework import generics, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from google.cloud import storage
from discussions.models import Discussion

from .models import Tutorial, TutorialTag
from .serializers import TutorialSerializer, TutorialWriteSerializer


md = MarkdownIt("commonmark", {"html": False, "linkify": True, "typographer": True}).enable("table")


def current_site_url():
    explicit = getattr(settings, "PUBLIC_SITE_URL", "").strip()
    if explicit:
        return explicit.rstrip("/")
    return "http://localhost:8000"


def choose_image(path_value, url_value):
    if path_value and getattr(settings, "GS_MEDIA_BUCKET_NAME", ""):
        return f"https://storage.googleapis.com/{settings.GS_MEDIA_BUCKET_NAME}/{quote(path_value, safe='/')}"
    return url_value or static("tutorials/images/tutorial-fallback.svg")


def render_markdown_with_toc(markdown_text):
    tokens = md.parse(markdown_text or "")
    headings = []
    current_heading = None

    for token in tokens:
        if token.type == "heading_open" and token.tag in {"h2", "h3"}:
            current_heading = {"level": int(token.tag[1]), "title": "", "id": ""}
            continue
        if current_heading and token.type == "inline":
            title = token.content.strip()
            anchor = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or f"section-{len(headings) + 1}"
            current_heading["title"] = title
            current_heading["id"] = anchor
            headings.append(current_heading)
            current_heading = None

    html = md.render(markdown_text or "")
    for heading in headings:
        pattern = rf"<h{heading['level']}>{re.escape(heading['title'])}</h{heading['level']}>"
        replacement = f'<h{heading["level"]} id="{heading["id"]}">{heading["title"]}</h{heading["level"]}>'
        html = re.sub(pattern, replacement, html, count=1)

    return html, headings


def author_public_username(user):
    profile = getattr(user, "profile", None)
    return getattr(profile, "public_username", user.username)


def author_display_name(user):
    return user.get_full_name() or user.username


def author_archive_url(user):
    return reverse("tutorials:author", kwargs={"public_username": author_public_username(user)})


def tutorial_context(tutorial):
    article_html, toc = render_markdown_with_toc(tutorial.body_markdown)
    cover_image = choose_image(tutorial.cover_image_path, tutorial.cover_image_url)
    thumbnail_image = choose_image(
        tutorial.thumbnail_image_path or tutorial.cover_image_path,
        tutorial.thumbnail_image_url or tutorial.cover_image_url,
    )
    canonical_url = f"{current_site_url()}{tutorial.absolute_url}"
    article_schema = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": tutorial.title,
        "description": tutorial.meta_description or tutorial.excerpt or tutorial.title,
        "image": [cover_image],
        "datePublished": (tutorial.published_at or tutorial.created_at).isoformat(),
        "dateModified": (tutorial.last_revised_at or tutorial.updated_at).isoformat(),
        "author": {
            "@type": "Person",
            "name": author_display_name(tutorial.author),
            "url": f"{current_site_url()}{author_archive_url(tutorial.author)}",
        },
        "publisher": {"@type": "Organization", "name": "Sabhuku AI", "url": current_site_url()},
        "mainEntityOfPage": canonical_url,
        "keywords": tutorial.public_tags,
    }
    related = Tutorial.objects.filter(status=Tutorial.STATUS_PUBLISHED).exclude(pk=tutorial.pk).prefetch_related("tags")[:4]
    return {
        "tutorial": tutorial,
        "article_html": article_html,
        "toc": toc,
        "cover_image": cover_image,
        "thumbnail_image": thumbnail_image,
        "related_tutorials": related,
        "fallback_image": static("tutorials/images/tutorial-fallback.svg"),
        "page_title": tutorial.seo_title or tutorial.title,
        "meta_description": tutorial.meta_description or tutorial.excerpt or tutorial.title,
        "canonical_url": canonical_url,
        "article_schema_json": json.dumps(article_schema),
    }


def tutorial_discussion_tree(tutorial):
    discussions = list(
        Discussion.objects.select_related("user", "user__profile")
        .filter(tutorial=tutorial)
        .order_by("created_at", "id")
    )
    by_parent = {}
    for discussion in discussions:
        by_parent.setdefault(discussion.parent_id, []).append(discussion)

    def attach_children(parent):
        children = by_parent.get(parent.id, [])
        parent.thread_replies = children
        for child in children:
            attach_children(child)

    roots = by_parent.get(None, [])
    for root in roots:
        attach_children(root)
    return roots


def _storage_bucket():
    client = storage.Client()
    return client.bucket(settings.GS_BUCKET_NAME)


def _build_blob_path(prefix, user_id, filename):
    safe_name = os.path.basename(filename).strip()
    if not safe_name:
        raise serializers.ValidationError({"filename": "filename is required"})
    return f"{prefix}/{user_id}/{uuid.uuid4()}_{safe_name}"


class SignedUploadRequestSerializer(serializers.Serializer):
    filename = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=255, required=False, allow_blank=True)


class TutorialPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return obj.status == Tutorial.STATUS_PUBLISHED
        return request.user.is_authenticated and obj.author_id == request.user.id


class TutorialViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "slug"

    def get_queryset(self):
        queryset = Tutorial.objects.select_related("author", "author__profile").prefetch_related("tags").all()
        if self.action in {"list", "retrieve"} and not self.request.user.is_authenticated:
            return queryset.filter(status=Tutorial.STATUS_PUBLISHED)
        if self.action in {"list", "retrieve"} and self.request.query_params.get("mine") == "true":
            return queryset.filter(author=self.request.user)
        if self.action in {"update", "partial_update", "destroy"}:
            return queryset.filter(author=self.request.user)
        return queryset

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy", "my_articles", "upload_url"}:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return TutorialWriteSerializer
        return TutorialSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers({})
        return Response(TutorialSerializer(serializer.instance).data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TutorialSerializer(serializer.instance).data)

    def retrieve(self, request, *args, **kwargs):
        tutorial = get_object_or_404(Tutorial.objects.select_related("author", "author__profile").prefetch_related("tags"), slug=kwargs["slug"])
        if tutorial.status != Tutorial.STATUS_PUBLISHED and tutorial.author != request.user:
            raise Http404
        serializer = TutorialSerializer(tutorial)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="mine")
    def my_articles(self, request):
        queryset = Tutorial.objects.filter(author=request.user).select_related("author", "author__profile").prefetch_related("tags")
        return Response(TutorialSerializer(queryset, many=True).data)

    @action(detail=False, methods=["post"], url_path="upload-url")
    def upload_url(self, request):
        serializer = SignedUploadRequestSerializer(data=request.data or request.query_params)
        serializer.is_valid(raise_exception=True)
        blob_path = _build_blob_path("tutorials", request.user.id, serializer.validated_data["filename"])
        content_type = serializer.validated_data.get("content_type") or "application/octet-stream"
        blob = _storage_bucket().blob(blob_path)
        upload_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=settings.GS_UPLOAD_URL_EXPIRATION_MINUTES),
            method="PUT",
            content_type=content_type,
        )
        return Response(
            {
                "upload_url": upload_url,
                "file_path": blob_path,
                "file_url": f"https://storage.googleapis.com/{settings.GS_BUCKET_NAME}/{quote(blob_path, safe='/')}",
                "content_type": content_type,
                "expires_in_minutes": settings.GS_UPLOAD_URL_EXPIRATION_MINUTES,
            }
        )
    

    @action(detail=False, methods=["post"], url_path="upload-image")
    def upload_image(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        content_type = file.content_type or "application/octet-stream"
        blob_path = _build_blob_path("tutorials/media", request.user.id, file.name)

        client = storage.Client()
        bucket = client.bucket(settings.GS_MEDIA_BUCKET_NAME)
        blob = bucket.blob(blob_path)
        blob.upload_from_file(file, content_type=content_type)
        # No ACL needed if bucket is public, otherwise:
        # blob.acl.all().grant_read()
        # blob.acl.save()

        file_url = f"https://storage.googleapis.com/{settings.GS_MEDIA_BUCKET_NAME}/{quote(blob_path, safe='/')}"
        return Response({
            "file_path": blob_path,
            "file_url": file_url,
        })


def tutorial_index(request):
    tutorials = Tutorial.objects.filter(status=Tutorial.STATUS_PUBLISHED).select_related("author", "author__profile").prefetch_related("tags")
    featured = tutorials.first()
    latest = tutorials[1:13] if featured else tutorials[:12]
    popular_tags = TutorialTag.objects.filter(tutorials__status=Tutorial.STATUS_PUBLISHED).distinct()[:10]
    return render(
        request,
        "tutorials/index.html",
        {
            "featured_tutorial": featured,
            "tutorials": latest,
            "popular_tags": popular_tags,
            "page_title": "Community Tutorials",
            "meta_description": "Expert AI tutorials, practical guides, and community knowledge from Sabhuku AI.",
            "canonical_url": f"{current_site_url()}{reverse('tutorials:index')}",
        },
    )


def tutorial_detail(request, slug):
    tutorial = get_object_or_404(
        Tutorial.objects.select_related("author", "author__profile").prefetch_related("tags"),
        slug=slug,
        status=Tutorial.STATUS_PUBLISHED,
    )
    comments_error = ""
    comments_form = {"content": "", "parent": ""}

    if request.method == "POST":
        comments_form = {
            "content": (request.POST.get("content") or "").strip(),
            "parent": (request.POST.get("parent") or "").strip(),
        }
        if not request.user.is_authenticated:
            comments_error = "Sign in to join the discussion."
        elif not comments_form["content"]:
            comments_error = "Comment text cannot be blank."
        else:
            parent = None
            parent_id = comments_form["parent"]
            if parent_id:
                parent = Discussion.objects.filter(tutorial=tutorial, pk=parent_id).first()
                if not parent:
                    comments_error = "That reply target could not be found."

            if not comments_error:
                comment = Discussion.objects.create(
                    user=request.user,
                    tutorial=tutorial,
                    parent=parent,
                    content=comments_form["content"],
                )
                return redirect(f"{tutorial.absolute_url}#comment-{comment.id}")

    context = tutorial_context(tutorial)
    context.update(
        {
            "discussion_threads": tutorial_discussion_tree(tutorial),
            "discussion_count": Discussion.objects.filter(tutorial=tutorial).count(),
            "comments_error": comments_error,
            "comments_form": comments_form,
        }
    )
    return render(request, "tutorials/detail.html", context)


def tutorial_tag_archive(request, slug):
    tag = get_object_or_404(TutorialTag, slug=slug)
    tutorials = tag.tutorials.filter(status=Tutorial.STATUS_PUBLISHED).select_related("author", "author__profile").prefetch_related("tags")
    return render(
        request,
        "tutorials/archive.html",
        {
            "archive_title": f"Tutorials tagged {tag.name}",
            "archive_description": f"Community tutorials about {tag.name} on Sabhuku AI.",
            "tutorials": tutorials,
            "page_title": f"{tag.name} Tutorials",
            "meta_description": f"Browse Sabhuku AI community tutorials tagged {tag.name}.",
            "canonical_url": f"{current_site_url()}{reverse('tutorials:tag', kwargs={'slug': slug})}",
        },
    )


def tutorial_author_archive(request, public_username):
    author = get_object_or_404(User.objects.select_related("profile"), profile__public_username=public_username)
    tutorials = author.tutorials.filter(status=Tutorial.STATUS_PUBLISHED).prefetch_related("tags")
    return render(
        request,
        "tutorials/archive.html",
        {
            "archive_title": f"Tutorials by {author_display_name(author)}",
            "archive_description": getattr(author.profile, "bio", "") or "Published tutorials from the Sabhuku AI community.",
            "tutorials": tutorials,
            "page_title": f"{author_display_name(author)} Articles",
            "meta_description": f"Read tutorials by {author_display_name(author)} on Sabhuku AI.",
            "canonical_url": f"{current_site_url()}{reverse('tutorials:author', kwargs={'public_username': public_username})}",
        },
    )


def tutorial_sitemap(request):
    items = [{"loc": f"{current_site_url()}{reverse('tutorials:index')}", "lastmod": timezone.now()}]
    for tutorial in Tutorial.objects.filter(status=Tutorial.STATUS_PUBLISHED).only("slug", "updated_at"):
        items.append({"loc": f"{current_site_url()}{tutorial.absolute_url}", "lastmod": tutorial.updated_at})
    response = render(request, "tutorials/sitemap.xml", {"items": items})
    return HttpResponse(response.content, content_type="application/xml")


def tutorial_feed(request):
    tutorials = Tutorial.objects.filter(status=Tutorial.STATUS_PUBLISHED).select_related("author", "author__profile").prefetch_related("tags")[:20]
    response = render(request, "tutorials/feed.xml", {"tutorials": tutorials, "site_url": current_site_url(), "updated_at": timezone.now()})
    return HttpResponse(response.content, content_type="application/rss+xml")
