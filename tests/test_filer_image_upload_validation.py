"""Which files the image upload endpoint accepts."""

import io
import json

from django.apps import apps
from django.contrib.auth.models import Permission, User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

import pytest

try:
    from filer.models import Image
    from PIL import Image as PILImage
except ModuleNotFoundError:
    pytest.skip("filer not available", allow_module_level=True)


def image_bytes(format, **save_kwargs):
    buffer = io.BytesIO()
    PILImage.new("RGB", (100, 100), color="red").save(
        buffer, format=format, **save_kwargs
    )
    return buffer.getvalue()


def multi_picture_jpeg_bytes():
    second_image = PILImage.new("RGB", (100, 100), color="blue")
    return image_bytes("MPO", save_all=True, append_images=[second_image])


SVG_WITH_SCRIPT = (
    b'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">'
    b"<script>alert(1)</script></svg>"
)


@pytest.fixture
def uploader_client(client, db):
    user = User.objects.create_user(
        username="uploader", password="testpass", is_staff=True
    )
    # get() fails if the permission doesn't exist.
    user.user_permissions.add(
        Permission.objects.get(content_type__app_label="filer", codename="add_image")
    )
    client.force_login(user)
    return client


def upload(client, filename, content):
    return client.post(
        reverse("filer_upload_handler"),
        data={"upload_file": SimpleUploadedFile(filename, content)},
    )


def assert_upload_rejected(response, expected_error):
    assert response.status_code == 400
    data = json.loads(response.content)
    assert data["error"] == "Invalid form data"
    assert len(data["errors"]["upload_file"]) == 1
    assert expected_error in data["errors"]["upload_file"][0]
    assert Image.objects.count() == 0, "No images were created"


@pytest.mark.parametrize(
    "filename, content, mime_type",
    [
        ("image.jpg", image_bytes("JPEG"), "image/jpeg"),
        ("image.jpeg", image_bytes("JPEG"), "image/jpeg"),
        ("image.PNG", image_bytes("PNG"), "image/png"),
        ("image.gif", image_bytes("GIF"), "image/gif"),
        ("image.webp", image_bytes("WEBP"), "image/webp"),
        ("multi_picture.jpg", multi_picture_jpeg_bytes(), "image/jpeg"),
    ],
)
def test_accepts_web_image_formats(uploader_client, filename, content, mime_type):
    response = upload(uploader_client, filename, content)

    assert response.status_code == 201
    assert json.loads(response.content)["mime_type"] == mime_type


@pytest.mark.parametrize(
    "filename, content, expected_error",
    [
        pytest.param(
            "image.bmp",
            image_bytes("BMP"),
            "File extension “bmp” is not allowed.",
            id="other-image-format",
        ),
        pytest.param(
            "image.html",
            image_bytes("PNG"),
            "File extension “html” is not allowed.",
            id="non-image-extension",
        ),
        pytest.param(
            "image.gif",
            image_bytes("PNG"),
            "The file content does not match its extension.",
            id="content-not-matching-extension",
        ),
        pytest.param(
            "image.png",
            image_bytes("BMP"),
            "The file content does not match its extension.",
            id="other-format-with-allowed-extension",
        ),
        pytest.param(
            "not_an_image.jpg",
            b"just some text",
            "Upload a valid image.",
            id="non-image-content",
        ),
        pytest.param(
            "broken.png",
            image_bytes("PNG")[:50],
            "Upload a valid image.",
            id="truncated-image",
        ),
        pytest.param("image.svg", SVG_WITH_SCRIPT, "Upload a valid image.", id="svg"),
    ],
)
def test_rejects_invalid_files(uploader_client, filename, content, expected_error):
    response = upload(uploader_client, filename, content)

    assert_upload_rejected(response, expected_error)


@pytest.mark.parametrize(
    "max_size, expected_error",
    [
        (100, "The file is too large. The maximum size is 100\xa0bytes."),
        (10_000, None),
        (None, None),
    ],
)
def test_max_image_upload_size(uploader_client, settings, max_size, expected_error):
    settings.DJANGO_PROSEMIRROR = {"max_image_upload_size": max_size}

    response = upload(uploader_client, "image.png", image_bytes("PNG"))

    if expected_error:
        assert_upload_rejected(response, expected_error)
    else:
        assert response.status_code == 201


@pytest.mark.parametrize(
    "whitelist, filename, content, allowed",
    [
        (["image/jpeg"], "image.png", image_bytes("PNG"), False),
        (["image/png"], "image.png", image_bytes("PNG"), True),
        (["image/*"], "image.png", image_bytes("PNG"), True),
        (["image/jpeg"], "multi_picture.jpg", multi_picture_jpeg_bytes(), True),
    ],
)
def test_applies_filer_mime_type_whitelist(
    uploader_client, monkeypatch, whitelist, filename, content, allowed
):
    monkeypatch.setattr(apps.get_app_config("filer"), "MIME_TYPE_WHITELIST", whitelist)

    response = upload(uploader_client, filename, content)

    if allowed:
        assert response.status_code == 201
    else:
        assert_upload_rejected(response, "upload denied by site security policy")


def test_applies_filer_file_validators(uploader_client, monkeypatch):
    try:
        from filer.validation import strip_exif
    except ImportError:
        pytest.skip("strip_exif requires django-filer 3.5 or newer")

    monkeypatch.setitem(
        apps.get_app_config("filer").FILE_VALIDATORS, "image/jpeg", [strip_exif]
    )
    image = PILImage.new("RGB", (100, 100), color="red")
    exif = image.getexif()
    exif[0x010E] = "description with private details"  # ImageDescription
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", exif=exif)

    response = upload(uploader_client, "photo.jpg", buffer.getvalue())

    assert response.status_code == 201
    img = Image.objects.get()
    with img.file.open("rb") as file:
        stored = file.read()
    # The stored size matches the rewritten file, not the upload.
    assert len(stored) == img.size
    with PILImage.open(io.BytesIO(stored)) as stored_image:
        assert dict(stored_image.getexif()) == {}
