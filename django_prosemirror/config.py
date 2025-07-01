from django_prosemirror.constants import DEFAULT_SETTINGS, SETTINGS_KEY


def get_setting(key: str):
    from django.conf import settings

    return getattr(settings, SETTINGS_KEY, DEFAULT_SETTINGS)[key]
