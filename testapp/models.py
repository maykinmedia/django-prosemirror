"""Test models demonstrating ProseMirror field usage."""

from django.db import models

from django_prosemirror.fields import ProsemirrorModelField
from django_prosemirror.schema import MarkType, NodeType


def get_default_full_content():
    return {
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "Default Heading"}],
            },
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "marks": [{"type": "strong"}],
                        "text": "Bold default text",
                    },
                    {"type": "text", "text": " and regular text."},
                ],
            },
        ],
    }


def get_empty_doc():
    return {"type": "doc", "content": []}


def get_default_formatted_text():
    return {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": "Default formatted text"}],
            }
        ],
    }


class TestModel(models.Model):  # noqa: DJ008
    """Test model with various ProseMirror field configurations."""

    full_schema_with_default = ProsemirrorModelField(
        # All node and mark types (default)
        verbose_name="Full Schema Rich Text",
        help_text="Rich text field with all node types enabled and default content",
        default=get_default_full_content,
    )

    full_schema_nullable = ProsemirrorModelField(
        # All node and mark types (default)
        null=True,
        blank=True,
        verbose_name="Full Schema (Nullable)",
        help_text="Rich text field with all node types, allows null values",
    )

    basic_text_only = ProsemirrorModelField(
        allowed_node_types=[NodeType.PARAGRAPH],  # Only paragraph nodes
        allowed_mark_types=[],  # No marks
        null=False,
        blank=True,
        verbose_name="Basic Text Only",
        help_text="Minimal text field with no formatting options",
        default=get_empty_doc,
    )

    text_formatting_only = ProsemirrorModelField(
        allowed_node_types=[NodeType.PARAGRAPH],
        allowed_mark_types=[MarkType.STRONG, MarkType.ITALIC, MarkType.CODE],
        verbose_name="Text Formatting Only",
        help_text="Text with basic formatting (bold, italic, code), no block elements",
        default=get_default_formatted_text,
    )

    headings_and_blocks = ProsemirrorModelField(
        allowed_node_types=[
            NodeType.PARAGRAPH,
            NodeType.HEADING,
            NodeType.BLOCKQUOTE,
            NodeType.HORIZONTAL_RULE,
        ],
        allowed_mark_types=[MarkType.STRONG, MarkType.ITALIC],
        null=True,
        blank=True,
        verbose_name="Headings and Blocks (Nullable)",
        help_text="Document structure with headings, quotes, and basic formatting",
    )

    code_content_nullable = ProsemirrorModelField(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.CODE_BLOCK],
        allowed_mark_types=[MarkType.CODE, MarkType.STRONG, MarkType.ITALIC],
        null=True,
        verbose_name="Code Content (Nullable)",
        help_text="Technical content with inline and block code support",
    )
