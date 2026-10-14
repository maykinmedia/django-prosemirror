"""Django Prosemirror constants."""

from typing import TypedDict


class ProseMirrorConfig(TypedDict):
    """Main configuration for django-prosemirror settings."""

    tag_to_classes: dict[str, str]
    allowed_node_types: list[str]
    allowed_mark_types: list[str]
    history: bool
    max_image_upload_size: int | None


def get_empty_doc() -> dict:
    """Return a fresh empty ProseMirror document dict."""
    return {"type": "doc", "content": []}


SETTINGS_KEY = "DJANGO_PROSEMIRROR"

# Image file extensions accepted for filer images, mapped to the formats Pillow may
# detect in the file content. MPO is a JPEG with additional images appended, as
# taken by some cameras. Mirrored in
# frontend/plugins/image-upload-plugin/upload.ts; keep both in sync.
ALLOWED_IMAGE_FORMATS: dict[str, tuple[str, ...]] = {
    "jpg": ("JPEG", "MPO"),
    "jpeg": ("JPEG", "MPO"),
    "png": ("PNG",),
    "gif": ("GIF",),
    "webp": ("WEBP",),
}

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
    # Maximum size of an image upload in bytes, or None for no limit.
    "max_image_upload_size": 10 * 1024 * 1024,
}
