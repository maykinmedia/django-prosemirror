from django.test import override_settings

import pytest


@pytest.fixture(autouse=True, scope="session")
def force_urlconf_reload():
    """Force urlconf reload to process conditional URL patterns (e.g. for filer)."""
    with override_settings(
        ROOT_URLCONF="testapp.urls",  # Force URL reload
    ):
        yield


def _point_storage_at(storage, location):
    """Repoint a FileSystemStorage, dropping its cached location properties."""
    storage._location = location
    storage.__dict__.pop("base_location", None)
    storage.__dict__.pop("location", None)


@pytest.fixture(autouse=True, scope="session")
def isolate_media_root(tmp_path_factory):
    """Keep files uploaded by tests out of the working tree.

    Overriding MEDIA_ROOT covers filer's public storages, which take their
    location from the setting. Its private storages are instantiated at import
    time with an explicit ``location`` (see ``filer.settings``), so they ignore
    MEDIA_ROOT and have to be repointed on the instances themselves -- the same
    instances the model fields hold a reference to.
    """
    media_root = tmp_path_factory.mktemp("media")

    private_storages = []
    try:
        from filer import settings as filer_settings
    except ModuleNotFoundError:
        pass
    else:
        private_storages = [
            (filer_settings.FILER_PRIVATEMEDIA_STORAGE, "filer_private"),
            (
                filer_settings.FILER_PRIVATEMEDIA_THUMBNAIL_STORAGE,
                "filer_private_thumbnails",
            ),
        ]

    originals = [storage._location for storage, _ in private_storages]
    for storage, subdir in private_storages:
        _point_storage_at(storage, str(media_root / subdir))

    with override_settings(MEDIA_ROOT=str(media_root)):
        yield

    for (storage, _), original in zip(private_storages, originals, strict=True):
        _point_storage_at(storage, original)
