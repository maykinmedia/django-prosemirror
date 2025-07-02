"""Django Prosemirror constants."""

from typing import TypedDict


class ProseMirrorConfig(TypedDict):
    """Main configuration for django-prosemirror settings."""

    tag_to_classes: dict[str, str]
    allowed_node_types: list[str]
    allowed_mark_types: list[str]
    history: bool


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
    },
    "allowed_node_types": [
        "paragraph",
        "blockquote", 
        "horizontal_rule",
        "heading",
        "image",
        "hard_break",
        "code_block",
        "unordered_list",
        "ordered_list",
        "list_item",
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
