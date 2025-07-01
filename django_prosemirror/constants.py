"""Django Prosemirror constants."""

from typing import TypedDict


class ProseMirrorConfig(TypedDict):
    """Main configuration for django-prosemirror settings."""

    tag_to_classes: dict[str, str]


EMPTY_DOC = {"type": "doc", "content": []}

SETTINGS_KEY = "DJANGO_PROSEMIRROR"

DEFAULT_SETTINGS: ProseMirrorConfig = {
    "tag_to_classes": {
        "paragraph": "",
        "heading": "",
        "image": "",
        "link": "",
        "blockquote": "",
        "code_block": "",
        "code": "",
        "ordered_list": "",
        "unordered_list": "",
        "list_item": "",
        "horizontal_rule": "",
    }
}
