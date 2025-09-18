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

_default_node_types = [
    "paragraph",
    "blockquote",
    "horizontal_rule",
    "heading",
    "hard_break",
    "code_block",
    "bullet_list",
    "ordered_list",
    "list_item",
    "table",
    "table_row",
    "table_cell",
    "table_header",
]

# Only include FILER_IMAGE if filer is available
try:
    import filer  # noqa: F401

    _default_node_types.append("filer_image")
except ImportError:
    pass

DEFAULT_SETTINGS: ProseMirrorConfig = {
    "tag_to_classes": {},
    "allowed_node_types": _default_node_types,
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
