from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.core import mail
from django.urls import reverse
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from allauth.account.utils import user_pk_to_url_str

from .models import Dataset, Model
from .utils import custom_password_reset_url_generator


class ModelUploadFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="tester", password="secret123")
        self.client.force_authenticate(user=self.user)

    @patch("api.views.storage.Client")
    def test_model_upload_url_returns_signed_url_and_sanitized_path(self, mock_storage_client):
        mock_blob = MagicMock()
        mock_blob.generate_signed_url.return_value = "https://signed-upload.example"
        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob
        mock_storage_client.return_value.bucket.return_value = mock_bucket

        response = self.client.post(
            "/api/models/upload-url/",
            {"filename": "../weights/model.bin", "content_type": "application/octet-stream"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["upload_url"], "https://signed-upload.example")
        self.assertTrue(response.data["file_path"].startswith(f"models/{self.user.id}/"))
        self.assertNotIn("..", response.data["file_path"])
        self.assertTrue(response.data["file_path"].endswith("_model.bin"))
        mock_blob.generate_signed_url.assert_called_once()

    def test_model_upload_url_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(
            "/api/models/upload-url/",
            {"filename": "model.bin"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_model_create_sets_author_and_defaults(self):
        response = self.client.post(
            "/api/models/",
            {
                "name": "Shona-GPT-7B",
                "description": "Language model",
                "category": "NLP",
                "tags": ["shona", "language-model"],
                "file_path": "models/1/shona-gpt.bin",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        model = Model.objects.get(pk=response.data["id"])
        self.assertEqual(model.author, self.user)
        self.assertEqual(model.license, "Custom")
        self.assertTrue(model.updated)

    @patch("api.views.storage.Client")
    def test_model_download_url_increments_downloads_and_returns_signed_url(self, mock_storage_client):
        model = Model.objects.create(
            name="Shona-GPT-7B",
            author=self.user,
            description="Language model",
            category="NLP",
            tags=["shona"],
            updated="2026-04-08T00:00:00Z",
            file_path="models/1/shona-gpt.bin",
            license="Custom",
        )
        mock_blob = MagicMock()
        mock_blob.generate_signed_url.return_value = "https://signed-download.example"
        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob
        mock_storage_client.return_value.bucket.return_value = mock_bucket

        response = self.client.get(f"/api/models/{model.id}/download-url/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["url"], "https://signed-download.example")
        model.refresh_from_db()
        self.assertEqual(model.downloads, 1)


class DatasetUploadFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="dataset-user", password="secret123")
        self.client.force_authenticate(user=self.user)

    @patch("api.views.storage.Client")
    def test_dataset_upload_url_returns_signed_url_and_sanitized_path(self, mock_storage_client):
        mock_blob = MagicMock()
        mock_blob.generate_signed_url.return_value = "https://signed-dataset-upload.example"
        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob
        mock_storage_client.return_value.bucket.return_value = mock_bucket

        response = self.client.post(
            "/api/datasets/upload-url/",
            {"filename": "../private/data.csv", "content_type": "text/csv"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["upload_url"], "https://signed-dataset-upload.example")
        self.assertTrue(response.data["file_path"].startswith(f"datasets/{self.user.id}/"))
        self.assertNotIn("..", response.data["file_path"])
        self.assertTrue(response.data["file_path"].endswith("_data.csv"))

    def test_dataset_create_sets_author_and_defaults(self):
        response = self.client.post(
            "/api/datasets/",
            {
                "name": "Zimbabwe Census 2022",
                "subtitle": "Official census release",
                "description": "National census dataset",
                "category": "Tabular",
                "size": "1.2 MB",
                "format": ["csv"],
                "tags": ["zimbabwe", "demographics"],
                "file_path": "datasets/1/zimbabwe-census.csv",
                "license": "CC BY 4.0",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        dataset = Dataset.objects.get(pk=response.data["id"])
        self.assertEqual(dataset.author, self.user)
        self.assertEqual(dataset.format, ["csv"])
        self.assertEqual(dataset.tags, ["zimbabwe", "demographics"])
        self.assertEqual(dataset.slug, "zimbabwe-census-2022")
        self.assertTrue(dataset.updated)

    @patch("api.views.storage.Client")
    def test_dataset_download_url_increments_downloads_and_returns_signed_url(self, mock_storage_client):
        dataset = Dataset.objects.create(
            name="Zimbabwe Census 2022",
            author=self.user,
            description="National census dataset",
            category="Tabular",
            size="1.2 MB",
            downloads=0,
            format=["csv"],
            tags=["zimbabwe", "demographics"],
            updated="2026-04-08T00:00:00Z",
            file_path="datasets/1/zimbabwe-census.csv",
            license="CC BY 4.0",
        )
        mock_blob = MagicMock()
        mock_blob.generate_signed_url.return_value = "https://signed-dataset-download.example"
        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob
        mock_storage_client.return_value.bucket.return_value = mock_bucket

        response = self.client.get(f"/api/datasets/{dataset.id}/download-url/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["url"], "https://signed-dataset-download.example")
        dataset.refresh_from_db()
        self.assertEqual(dataset.downloads, 1)

    def test_dataset_can_be_fetched_by_public_owner_and_slug(self):
        self.user.profile.public_username = "dataset-owner"
        self.user.profile.save(update_fields=["public_username"])
        dataset = Dataset.objects.create(
            name="Zimbabwe Census 2022",
            author=self.user,
            description="National census dataset",
            category="Tabular",
            size="1.2 MB",
            format=["csv"],
            tags=["zimbabwe"],
            updated="2026-04-08T00:00:00Z",
            file_path="datasets/1/zimbabwe-census.csv",
            license="CC BY 4.0",
        )

        response = self.client.get("/api/datasets/by-owner/dataset-owner/zimbabwe-census-2022/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], dataset.id)
        self.assertEqual(response.data["author_public_username"], "dataset-owner")


class ProfileTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="person@example.com",
            email="person@example.com",
            password="secret123",
            first_name="Tinaye",
            last_name="Kucherera",
        )
        self.client.force_authenticate(user=self.user)

    def test_profile_retrieval_includes_name_and_image_fields(self):
        profile = self.user.profile
        profile.public_username = "tinaye"
        profile.avatar_url = "https://example.com/avatar.png"
        profile.cover_image_url = "https://example.com/cover.png"
        profile.save(update_fields=["public_username", "avatar_url", "cover_image_url"])

        response = self.client.get("/api/profile/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["public_username"], "tinaye")
        self.assertEqual(response.data["first_name"], "Tinaye")
        self.assertEqual(response.data["last_name"], "Kucherera")
        self.assertEqual(response.data["avatar_url"], "https://example.com/avatar.png")
        self.assertEqual(response.data["cover_image_url"], "https://example.com/cover.png")

    @patch("api.serializers.storage.Client")
    def test_profile_retrieval_signs_private_image_paths(self, mock_storage_client):
        mock_blob = MagicMock()
        mock_blob.generate_signed_url.side_effect = [
            "https://signed-avatar.example",
            "https://signed-cover.example",
        ]
        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob
        mock_storage_client.return_value.bucket.return_value = mock_bucket

        profile = self.user.profile
        profile.public_username = "tinaye"
        profile.avatar_path = "profiles/1/avatar image.png"
        profile.cover_image_path = "profiles/1/cover image.png"
        profile.save(update_fields=["public_username", "avatar_path", "cover_image_path"])

        response = self.client.get("/api/profile/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["avatar_url"], "https://signed-avatar.example")
        self.assertEqual(response.data["cover_image_url"], "https://signed-cover.example")

    @patch("api.serializers.storage.Client")
    def test_profile_update_updates_user_and_profile_fields(self, mock_storage_client):
        mock_blob = MagicMock()
        mock_blob.generate_signed_url.side_effect = [
            "https://signed-avatar.example",
            "https://signed-cover.example",
        ]
        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob
        mock_storage_client.return_value.bucket.return_value = mock_bucket

        response = self.client.patch(
            "/api/profile/",
            {
                "public_username": "tinashe-k",
                "first_name": "Tinashe",
                "last_name": "Kucherera",
                "title": "ML Engineer",
                "avatar_path": "profiles/1/new-avatar.png",
                "cover_image_path": "profiles/1/new-cover.png",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.public_username, "tinashe-k")
        self.assertEqual(self.user.first_name, "Tinashe")
        self.assertEqual(self.user.last_name, "Kucherera")
        self.assertEqual(self.user.profile.avatar_path, "profiles/1/new-avatar.png")
        self.assertEqual(self.user.profile.cover_image_path, "profiles/1/new-cover.png")

    @patch("api.views.storage.Client")
    def test_profile_upload_url_returns_signed_upload_data(self, mock_storage_client):
        mock_blob = MagicMock()
        mock_blob.generate_signed_url.return_value = "https://signed-profile-upload.example"
        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob
        mock_storage_client.return_value.bucket.return_value = mock_bucket

        response = self.client.post(
            "/api/profile/upload-url/",
            {"filename": "avatar image.png", "content_type": "image/png"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["upload_url"], "https://signed-profile-upload.example")
        self.assertTrue(response.data["file_path"].startswith(f"profiles/{self.user.id}/"))
        self.assertTrue(response.data["file_url"].endswith(".png"))
        self.assertIn("avatar%20image.png", response.data["file_url"])
        self.assertIn("%20", response.data["file_url"])


class PasswordResetTests(APITestCase):
    def test_password_reset_confirm_route_is_provided_by_dj_rest_auth(self):
        self.assertEqual(reverse("rest_password_reset_confirm"), "/api/auth/password/reset/confirm")

    def test_password_reset_url_generator_uses_frontend_route_and_encoded_uid(self):
        user = User.objects.create_user(
            username="reset-user",
            email="reset@example.com",
            password="secret123",
        )

        with patch.dict("os.environ", {"FRONTEND_URL": "http://localhost:5173/"}):
            url = custom_password_reset_url_generator(None, user, "sample-token")

        expected_uid = user_pk_to_url_str(user)
        self.assertEqual(
            url,
            f"http://localhost:5173/password-reset/confirm/{expected_uid}/sample-token",
        )

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_password_reset_request_sends_html_email(self):
        User.objects.create_user(
            username="reset-html-user",
            email="reset-html@example.com",
            password="secret123",
        )

        with patch.dict("os.environ", {"FRONTEND_URL": "http://localhost:5173"}):
            response = self.client.post(
                "/api/auth/password/reset/",
                {"email": "reset-html@example.com"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Reset your SABHUKU AI password", mail.outbox[0].subject)
        self.assertIn("http://localhost:5173/password-reset/confirm/", mail.outbox[0].body)
        self.assertEqual(len(mail.outbox[0].alternatives), 1)
        self.assertEqual(mail.outbox[0].alternatives[0].mimetype, "text/html")
        self.assertIn("Reset password", mail.outbox[0].alternatives[0].content)


class LoginTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="legacy@example.com",
            email="legacy@example.com",
            password="secret123",
        )
        self.user.profile.public_username = "legacy-user"
        self.user.profile.save(update_fields=["public_username"])

    def test_login_accepts_legacy_email_in_username_field(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "legacy@example.com", "password": "secret123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_login_accepts_public_username(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "legacy-user", "password": "secret123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)


class DashboardTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="dashboard@example.com",
            email="dashboard@example.com",
            password="secret123",
            first_name="Dash",
            last_name="Board",
        )
        self.user.profile.public_username = "dash-board"
        self.user.profile.save(update_fields=["public_username"])
        self.client.force_authenticate(user=self.user)

    @patch("api.serializers.storage.Client")
    def test_dashboard_returns_live_summary_data(self, mock_storage_client):
        mock_blob = MagicMock()
        mock_blob.generate_signed_url.return_value = "https://signed-avatar.example"
        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob
        mock_storage_client.return_value.bucket.return_value = mock_bucket

        self.user.profile.avatar_path = "profiles/1/avatar.png"
        self.user.profile.save(update_fields=["avatar_path"])

        Model.objects.create(
            name="User Model",
            author=self.user,
            description="Owned by current user",
            category="NLP",
            downloads=10,
            likes=2,
            trending=True,
            tags=["nlp"],
            updated="2026-04-10T00:00:00Z",
            file_path="models/1/user-model.bin",
            license="Custom",
        )
        other_user = User.objects.create_user(username="other@example.com", password="secret123")
        Dataset.objects.create(
            name="Public Dataset",
            author=other_user,
            description="Community dataset",
            category="Tabular",
            size="3 GB",
            downloads=25,
            format=["csv"],
            tags=["public"],
            updated="2026-04-10T00:00:00Z",
            file_path="datasets/1/public.csv",
            license="CC BY 4.0",
            is_public=True,
        )

        response = self.client.get("/api/dashboard/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["public_username"], "dash-board")
        self.assertEqual(response.data["user"]["avatar_url"], "https://signed-avatar.example")
        self.assertEqual(response.data["stats"]["your_models"], 1)
        self.assertEqual(response.data["stats"]["community_datasets"], 1)
        self.assertEqual(len(response.data["trending_models"]), 1)
        self.assertEqual(len(response.data["popular_datasets"]), 1)
