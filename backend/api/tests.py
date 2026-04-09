from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Dataset, Model


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
                "description": "National census dataset",
                "category": "Tabular",
                "size": "1.2 MB",
                "format": ["csv"],
                "file_path": "datasets/1/zimbabwe-census.csv",
                "license": "CC BY 4.0",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        dataset = Dataset.objects.get(pk=response.data["id"])
        self.assertEqual(dataset.author, self.user)
        self.assertEqual(dataset.format, ["csv"])
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
