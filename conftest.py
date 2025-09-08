from django.test import override_settings

import pytest


@pytest.fixture(autouse=True, scope="session")
def enable_filer_by_default():
    """Enable filer image uploads by default for most tests."""
    with override_settings(
        DJANGO_PROSEMIRROR={"filer_image_uploads_enabled": True},
        ROOT_URLCONF="testapp.urls",  # Force URL reload
    ):
        yield
