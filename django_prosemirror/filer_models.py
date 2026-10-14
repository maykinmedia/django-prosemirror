"""
django-filer's image model and its permissions.

Projects can swap filer's image model with ``FILER_IMAGE_MODEL``. Use the
configured model, as filer itself does, rather than ``filer.models.Image``:
when swapped, that model has no table and its permissions don't exist.

Only import this module when filer is installed.
"""

from django.contrib.auth import get_permission_codename

from filer import settings as filer_settings
from filer.utils.loader import load_model


def get_image_model():
    """The image model configured with ``FILER_IMAGE_MODEL``."""
    return load_model(filer_settings.FILER_IMAGE_MODEL)


def image_permission(action: str) -> str:
    """
    The permission to perform the action on images, e.g. ``"filer.add_image"``.

    Args:
        action: The permission's action: "add", "change", "delete" or "view".
    """
    opts = get_image_model()._meta
    return f"{opts.app_label}.{get_permission_codename(action, opts)}"
