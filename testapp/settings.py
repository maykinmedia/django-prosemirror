from pathlib import Path

from django_prosemirror.constants import ProseMirrorConfig

BASE_DIR = Path(__file__).resolve(strict=True).parent

SECRET_KEY = "so-secret-i-cant-believe-you-are-looking-at-this"

USE_TZ = True

DEBUG = True

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "django_prosemirror.db",
    }
}

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "django.contrib.auth",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.admin",
    "django_prosemirror",
    "testapp",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "static"

ROOT_URLCONF = "testapp.urls"

DJANGO_PROSEMIRROR: ProseMirrorConfig = {
    "tag_to_classes": {
        "paragraph": "from_settings",
        "heading": "from_settings",
        "image": "from_settings",
        "link": "from_settings",
        "blockquote": "from_settings",
        "code_block": "from_settings",
        "code": "from_settings",
        "ordered_list": "from_settings",
        "bullet_list": "from_settings",
        "list_item": "from_settings",
        "horizontal_rule": "from_settings",
    },
    "allowed_node_types": [
        "paragraph",
        "blockquote",
        "horizontal_rule",
        "heading",
        "image",
        "hard_break",
        "code_block",
        "bullet_list",
        "ordered_list",
        "list_item",
        "table",
        "table_row",
        "table_cell",
        "table_header",
    ],
    "allowed_mark_types": [
        "strong",
        "em",
        "link",
        "code",
        "underline",
        "strikethrough",
    ],
    "history": True,
}
