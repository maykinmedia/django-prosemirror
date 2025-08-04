import json

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse


class FilerUploadHandlerViewTestCase(TestCase):
    def test_filer_upload_handler_post_with_valid_file(self):
        file_content = b"Test file content"
        mock_file = SimpleUploadedFile(
            "test_document.pdf", file_content, content_type="application/pdf"
        )

        response = self.client.post(
            reverse("filer_upload_handler"),
            data={"upload_file": mock_file},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/json")

        value = json.loads(response.content)

        expected = {
            "id": 123,
            "name": "test_document.pdf",
            "original_filename": "test_document.pdf",
            "file_size": len(file_content),
            "mime_type": "application/pdf",
            "uploaded_at": "2024-01-15T10:30:00Z",
            "description": "Uploaded file: test_document.pdf",
            "folder": {"id": 45, "name": "Documents"},
            "owner": {"id": 1, "username": "admin"},
            "url": "/media/filer_public/test_document.pdf",
            "is_public": True,
        }

        self.assertEqual(value, expected)

    def test_filer_upload_handler_post_with_custom_destination(self):
        """Test POST request with custom destination path."""
        file_content = b"Test file content"
        mock_file = SimpleUploadedFile(
            "test_document.pdf", file_content, content_type="application/pdf"
        )

        response = self.client.post(
            reverse("filer_upload_handler"),
            data={"upload_file": mock_file, "destination_path": "/custom/path/"},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        expected_url = "/media/filer_public/custom/path/test_document.pdf"
        self.assertEqual(data["url"], expected_url)

    def test_filer_upload_handler_post_without_file(self):
        response = self.client.post(reverse("filer_upload_handler"))

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response["Content-Type"], "application/json")

        data = json.loads(response.content)
        self.assertEqual(data["error"], "Invalid form data")

    def test_filer_upload_handler_get_not_allowed(self):
        response = self.client.get(reverse("filer_upload_handler"))
        self.assertEqual(response.status_code, 405)
