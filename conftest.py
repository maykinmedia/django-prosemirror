from django.test import override_settings

import pytest


@pytest.fixture(autouse=True, scope="session")
def force_urlconf_reload():
    """Force urlconf reload to process conditional URL patterns (e.g. for filer)."""
    with override_settings(
        ROOT_URLCONF="testapp.urls",  # Force URL reload
    ):
        yield
