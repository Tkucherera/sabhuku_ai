from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views


app_name = "tutorials"

router = DefaultRouter()
router.register(r"tutorials", views.TutorialViewSet, basename="tutorial-api")

urlpatterns = [
    path("community/tutorials/", views.tutorial_index, name="index"),
    path("community/tutorials/feed.xml", views.tutorial_feed, name="feed"),
    path("community/tutorials/sitemap.xml", views.tutorial_sitemap, name="sitemap"),
    path("community/tutorials/tags/<slug:slug>/", views.tutorial_tag_archive, name="tag"),
    path("community/tutorials/authors/<slug:public_username>/", views.tutorial_author_archive, name="author"),
    path("community/tutorials/<slug:slug>/", views.tutorial_detail, name="detail"),
    path("api/", include(router.urls)),
]
