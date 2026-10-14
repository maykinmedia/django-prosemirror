import io
import os

from django.conf import settings
from django.contrib.auth.models import Permission, User
from django.test import Client

import pytest
from playwright.sync_api import Page, expect

os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "1"


pytestmark = [pytest.mark.browser_context_args(record_video_dir="playwright-videos/")]

MALICIOUS_SVG = (
    b'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">'
    b"<script>alert(document.cookie)</script></svg>"
)


def png_bytes():
    from PIL import Image as PILImage

    buffer = io.BytesIO()
    PILImage.new("RGB", (20, 20), color="red").save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture
def image_uploader(transactional_db, live_server, page: Page):
    """Log the browser in as a staff user allowed to upload filer images."""
    pytest.importorskip("filer")

    user = User.objects.create_user(username="editor", is_staff=True)
    user.user_permissions.add(
        Permission.objects.get(content_type__app_label="filer", codename="add_image")
    )
    client = Client()
    client.force_login(user)
    page.context.add_cookies(
        [
            {
                "name": settings.SESSION_COOKIE_NAME,
                "value": client.cookies[settings.SESSION_COOKIE_NAME].value,
                "url": live_server.url,
            }
        ]
    )
    return user


UPLOAD_URL_PATTERN = "**/filer-image-upload/"


def choose_file(page: Page, editor, name: str, mime_type: str, data: bytes):
    """Choose a file with the editor's image button.

    Choosing the file directly bypasses the file picker's type filter, like
    picking "All files" would.
    """
    editor.locator(".ProseMirror p").first.click()
    with page.expect_file_chooser() as chooser_info:
        editor.locator('[title="Insert image"]').click()
    chooser_info.value.set_files({"name": name, "mimeType": mime_type, "buffer": data})


def upload_through_editor(page: Page, editor, name: str, mime_type: str, data: bytes):
    """Upload a file with the editor's image button and wait for the response."""
    with page.expect_response(UPLOAD_URL_PATTERN) as response_info:
        choose_file(page, editor, name, mime_type, data)
    return response_info.value


def inserted_images(editor):
    return editor.locator(".ProseMirror img:not(.ProseMirror-separator)")


def test_entered_text_is_maintained(live_server, page: Page):
    page.goto(f"{live_server.url}/form/")

    editor = page.locator("[data-prosemirror-id=id_heading_only]")
    editor.click()
    editor.type("The chicken is in picadilly square")

    with page.expect_navigation():
        btn = page.locator("#submit-btn")
        btn.click()

    editor = page.locator("[data-prosemirror-id=id_heading_only]")
    expect(editor).to_contain_text("The chicken is in picadilly square")


def test_uploaded_image_is_inserted_and_saved_with_reference(
    image_uploader, live_server, page: Page
):
    from filer.models import Image

    from testapp.models import TestModel

    page.goto(f"{live_server.url}/model-form/")
    editor = page.locator("[data-prosemirror-id=id_full_schema_with_default]")

    response = upload_through_editor(
        page, editor, "photo.png", "image/png", png_bytes()
    )

    assert response.status == 201
    image = Image.objects.get()
    inserted = inserted_images(editor)
    expect(inserted).to_have_attribute("src", image.url)
    expect(inserted).to_have_attribute("id", str(image.pk))

    with page.expect_navigation():
        page.locator("#submit-btn").click()

    doc = TestModel.objects.get().full_schema_with_default.doc
    image_nodes = [
        node
        for block in doc["content"]
        for node in block.get("content", [])
        if node["type"] == "filer_image"
    ]
    assert len(image_nodes) == 1
    assert image_nodes[0]["attrs"]["imageId"] == str(image.pk)
    assert image_nodes[0]["attrs"]["src"] == image.url


def test_upload_of_non_image_is_rejected_in_the_browser(
    image_uploader, live_server, page: Page
):
    from filer.models import Image

    page.goto(f"{live_server.url}/model-form/")
    editor = page.locator("[data-prosemirror-id=id_full_schema_with_default]")
    upload_requests = []
    page.on(
        "request",
        lambda request: (
            upload_requests.append(request)
            if "/filer-image-upload/" in request.url
            else None
        ),
    )

    choose_file(page, editor, "evil.svg", "image/svg+xml", MALICIOUS_SVG)

    expect(page.get_by_role("alert")).to_contain_text(
        "evil.svg: This file is not a supported image"
    )
    assert upload_requests == []
    assert Image.objects.count() == 0
    expect(inserted_images(editor)).to_have_count(0)


def test_upload_rejected_by_the_server_inserts_nothing(
    image_uploader, live_server, page: Page
):
    from filer.models import Image

    page.goto(f"{live_server.url}/model-form/")
    editor = page.locator("[data-prosemirror-id=id_full_schema_with_default]")

    # The browser only checks that the content is an allowed image; the server
    # also requires it to match the extension.
    response = upload_through_editor(
        page, editor, "photo.gif", "image/gif", png_bytes()
    )

    assert response.status == 400
    expect(page.get_by_role("alert")).to_contain_text(
        "photo.gif: The file content does not match its extension."
    )
    assert Image.objects.count() == 0
    expect(inserted_images(editor)).to_have_count(0)
