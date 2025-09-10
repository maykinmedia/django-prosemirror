import io
import json
from urllib.parse import urlencode

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse

import pytest

from django_prosemirror import urls as prosemirror_urls

try:
    from filer import settings as filer_settings
    from filer.models import Image
    from PIL import Image as PILImage
except ModuleNotFoundError:
    pytest.skip("filer not available", allow_module_level=True)


def create_test_image(name="test_image.jpg", format="JPEG", size=(100, 100)):
    image = PILImage.new("RGB", size, color="red")
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    buffer.seek(0)
    return SimpleUploadedFile(
        name, buffer.getvalue(), content_type=f"image/{format.lower()}"
    )


class TestFilerUrlsEnabled(TestCase):
    """Test that filer URLs are included when filer is available."""

    def test_filer_urls_included_when_filer_available(self):
        """Test that filer URLs are included when filer is available."""
        # Check that filer URLs are in the urlpatterns
        url_names = [
            pattern.name
            for pattern in prosemirror_urls.urlpatterns
            if hasattr(pattern, "name")
        ]

        self.assertIn("filer_upload_handler", url_names)
        self.assertIn("filer_edit_handler", url_names)

    def test_reverse_works_for_filer_urls_when_available(self):
        """Test that reversing filer URLs works when filer is available."""
        # These should not raise NoReverseMatch
        try:
            reverse("filer_upload_handler")
            reverse("filer_edit_handler", kwargs={"image_pk": "1"})
        except Exception as e:
            self.fail(f"URL reversal should work when filer is available: {e}")


class FilerUploadHandlerViewTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="testpass")
        self.client.login(username="testuser", password="testpass")
        self.mock_file = create_test_image("test_image.jpg")

    def test_filer_upload_handler_with_valid_file_creates_image_and_returns_metadata(
        self,
    ):
        response = self.client.post(
            reverse("filer_upload_handler"),
            data={"upload_file": self.mock_file},
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response["Content-Type"], "application/json")

        data = json.loads(response.content)

        # Verify that an Image was created
        img = Image.objects.get()  # Should only be a single image
        self.assertEqual(img.original_filename, "test_image.jpg")
        self.assertEqual(img.owner, self.user)
        self.assertEqual(img.is_public, filer_settings.FILER_IS_PUBLIC_DEFAULT)

        expected_response = {
            "id": str(img.pk),
            "name": img.label,
            "original_filename": "test_image.jpg",
            "file_size": img.size,
            "mime_type": "image/jpeg",
            "uploaded_at": img.uploaded_at.isoformat(),
            "url": img.url,
            "title": img.name,
            "alt_text": img.default_alt_text,
            "caption": img.default_caption,
            "description": img.description,
        }

        self.assertEqual(data, expected_response)

    def test_filer_upload_handler_requires_authentication(self):
        """Test that the upload handler requires authentication."""
        self.client.logout()

        response = self.client.post(
            reverse("filer_upload_handler"),
            data={"upload_file": self.mock_file},
            format="multipart",
        )

        self.assertEqual(response.status_code, 302, msg="Should redirect to login")
        self.assertEqual(Image.objects.count(), 0, msg="No images were created")

    def test_filer_upload_handler_post_without_file(self):
        response = self.client.post(reverse("filer_upload_handler"))

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response["Content-Type"], "application/json")

        data = json.loads(response.content)

        # Assert against the full expected error response
        expected_response = {
            "error": "Invalid form data",
            "errors": {"upload_file": ["This field is required."]},
        }

        self.assertEqual(data, expected_response)

        self.assertEqual(Image.objects.count(), 0, msg="No images were created")

    def test_filer_upload_handler_post_non_multipart(self):
        # Send data as regular POST instead of multipart
        response = self.client.post(
            reverse("filer_upload_handler"),
            data={"upload_file": "fake_file_data"},  # This won't be treated as a file
            content_type="application/x-www-form-urlencoded",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response["Content-Type"], "application/json")

        data = json.loads(response.content)

        # Assert against the full expected error response for non-multipart
        expected_response = {
            "error": "File upload requires multipart/form-data content type"
        }

        self.assertEqual(data, expected_response)
        self.assertEqual(Image.objects.count(), 0, msg="No images were created")

    def test_filer_upload_handler_post_json_content_type(self):
        response = self.client.post(
            reverse("filer_upload_handler"),
            data='{"upload_file": "fake_data"}',
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response["Content-Type"], "application/json")

        data = json.loads(response.content)

        # Should get the same content type error
        expected_response = {
            "error": "File upload requires multipart/form-data content type"
        }

        self.assertEqual(data, expected_response)
        self.assertEqual(Image.objects.count(), 0, msg="No images were created")

    def test_filer_upload_handler_get_not_allowed(self):
        response = self.client.get(reverse("filer_upload_handler"))

        self.assertEqual(response.status_code, 405)
        self.assertEqual(Image.objects.count(), 0, msg="No images were created")


class FilerEditHandlerViewTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="testpass")
        self.client.login(username="testuser", password="testpass")

        # Create a test image
        mock_file = create_test_image("test_image.jpg")
        self.image = Image.objects.create(
            name="Original name",
            description="Original description",
            original_filename="test_image.jpg",
            file=mock_file,
            owner=self.user,
            is_public=False,
        )

    def test_filer_edit_handler_get_returns_correct_image_data(self):
        response = self.client.get(
            reverse("filer_edit_handler", args=[str(self.image.pk)])
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/json")

        data = json.loads(response.content)

        # Assert against the full JSON response structure
        expected_response = {
            "id": str(self.image.pk),
            "name": self.image.label,
            "original_filename": "test_image.jpg",
            "file_size": self.image.size,
            "mime_type": self.image.mime_type,
            "uploaded_at": self.image.uploaded_at.isoformat(),
            "url": self.image.url,
            "title": self.image.name,
            "alt_text": self.image.default_alt_text,
            "caption": self.image.default_caption,
            "description": self.image.description,
        }

        self.assertEqual(data, expected_response)

    def test_filer_edit_handler_patch_valid_data_updates_and_returns_image(self):
        patch_data = {
            "name": "Updated Name",
            "description": "Updated description",
            "default_caption": "Updated caption",
        }

        # Encode the data as URL-encoded string
        encoded_data = urlencode(patch_data)
        response = self.client.patch(
            reverse("filer_edit_handler", args=[str(self.image.pk)]),
            data=encoded_data,
            content_type="application/x-www-form-urlencoded",
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        # Verify the image was updated
        self.image.refresh_from_db()
        expected_response = {
            "id": str(self.image.pk),
            "name": self.image.label,
            "original_filename": "test_image.jpg",
            "file_size": self.image.size,
            "mime_type": self.image.mime_type,
            "uploaded_at": self.image.uploaded_at.isoformat(),
            "url": self.image.url,
            "title": "Updated Name",
            "alt_text": self.image.default_alt_text,
            "caption": "Updated caption",
            "description": "Updated description",
        }

        self.assertEqual(data, expected_response)

    def test_filer_edit_handler_patch_with_validation_error_returns_error_response(
        self,
    ):
        patch_data = {
            "name": "x" * 256,  # Exceeds max_length=255
            "description": "Valid description",
        }

        encoded_data = urlencode(patch_data)

        response = self.client.patch(
            reverse("filer_edit_handler", args=[str(self.image.pk)]),
            data=encoded_data,
            content_type="application/x-www-form-urlencoded",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response["Content-Type"], "application/json")

        data = json.loads(response.content)
        expected_response = {
            "error": "Invalid form data",
            "errors": {
                "name": ["Ensure this value has at most 255 characters (it has 256)."]
            },
        }

        self.assertEqual(data, expected_response)

        self.image.refresh_from_db()
        self.assertEqual(
            self.image.name, "Original name", msg="Original name should not be modified"
        )
        self.assertEqual(
            self.image.description,
            "Original description",
            msg="Original description should not be modified",
        )

    def test_filer_edit_handler_patch_with_multiple_validation_errors_returns_all(
        self,
    ):
        patch_data = {
            "name": "x" * 256,
            "default_caption": "y" * 256,
            "description": "Valid description",
        }

        encoded_data = urlencode(patch_data)

        response = self.client.patch(
            reverse("filer_edit_handler", args=[str(self.image.pk)]),
            data=encoded_data,
            content_type="application/x-www-form-urlencoded",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response["Content-Type"], "application/json")

        data = json.loads(response.content)

        expected_response = {
            "error": "Invalid form data",
            "errors": {
                "name": ["Ensure this value has at most 255 characters (it has 256)."],
                "default_caption": [
                    "Ensure this value has at most 255 characters (it has 256)."
                ],
            },
        }

        self.assertEqual(data, expected_response)

        # Ensure the image was not modified
        self.image.refresh_from_db()
        self.assertEqual(
            self.image.name, "Original name", msg="Original name should not be modified"
        )
        self.assertEqual(
            self.image.description,
            "Original description",
            msg="Original description should not be modified",
        )

    def test_filer_edit_handler_nonexistent_image_returns_json_error(self):
        """Test request for non-existent image returns JSON 404 error."""
        response = self.client.get(reverse("filer_edit_handler", args=["999999"]))

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response["Content-Type"], "application/json")

        data = json.loads(response.content)

        # Assert against the full expected error response
        expected_response = {"error": "Image not found"}

        self.assertEqual(data, expected_response)

    def test_filer_edit_handler_patch_nonexistent_image_returns_json_error(self):
        patch_data = {
            "name": "Updated Name",
            "description": "Updated description",
        }

        encoded_data = urlencode(patch_data)

        response = self.client.patch(
            reverse("filer_edit_handler", args=["999999"]),
            data=encoded_data,
            content_type="application/x-www-form-urlencoded",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response["Content-Type"], "application/json")

        data = json.loads(response.content)

        # Assert against the full expected error response
        expected_response = {"error": "Image not found"}

        self.assertEqual(data, expected_response)

    def test_filer_edit_handler_requires_authentication(self):
        self.client.logout()

        response = self.client.get(
            reverse("filer_edit_handler", args=[str(self.image.pk)])
        )

        # Should redirect to login
        self.assertEqual(response.status_code, 302)

    def test_filer_edit_handler_post_not_allowed(self):
        response = self.client.post(
            reverse("filer_edit_handler", args=[str(self.image.pk)]),
            data={"name": "test"},
        )

        self.assertEqual(response.status_code, 405)
