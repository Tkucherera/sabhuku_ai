from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status

from .models import Discussion
from tutorials.models import Tutorial


class TutorialDiscussionTests(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(username="author", password="secret123")
        self.commenter = User.objects.create_user(
            username="commenter",
            password="secret123",
            first_name="Tariro",
            last_name="Moyo",
        )
        self.tutorial = Tutorial.objects.create(
            title="Deploying Models in Harare",
            author=self.author,
            excerpt="A practical deployment guide.",
            body_markdown="## Intro\nHelpful notes",
            status=Tutorial.STATUS_PUBLISHED,
        )

    def test_tutorial_detail_renders_existing_comments(self):
        Discussion.objects.create(user=self.commenter, tutorial=self.tutorial, content="This was very useful.")

        response = self.client.get(self.tutorial.absolute_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, "Discussion")
        self.assertContains(response, "This was very useful.")

    def test_authenticated_user_can_post_comment_from_tutorial_page(self):
        self.client.force_login(self.commenter)

        response = self.client.post(
            self.tutorial.absolute_url,
            {"content": "Adding a field note from production."},
        )

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertTrue(
            Discussion.objects.filter(
                tutorial=self.tutorial,
                user=self.commenter,
                content="Adding a field note from production.",
            ).exists()
        )

    def test_tutorial_discussions_api_supports_threads(self):
        self.client.force_login(self.commenter)
        root = Discussion.objects.create(user=self.commenter, tutorial=self.tutorial, content="Top level thought")

        create_response = self.client.post(
            f"/api/discussions/tutorials/{self.tutorial.id}/",
            {"content": "Follow-up note", "parent": root.id},
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        list_response = self.client.get(f"/api/discussions/tutorials/{self.tutorial.id}/")

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.json()), 1)
        self.assertEqual(list_response.json()[0]["content"], "Top level thought")
        self.assertEqual(len(list_response.json()[0]["replies"]), 1)
        self.assertEqual(list_response.json()[0]["replies"][0]["content"], "Follow-up note")
