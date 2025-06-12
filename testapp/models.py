"""Test models demonstrating ProseMirror field usage."""

from django.db import models

from django_prosemirror.fields import ProsemirrorModelField
from django_prosemirror.schema import FULL, AllowedNodeType


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
        schema=FULL,
        verbose_name="Full Schema Rich Text",
        help_text="Rich text field with all node types enabled and default content",
        default=get_default_full_content,
    )

    full_schema_nullable = ProsemirrorModelField(
        schema=FULL,
        null=True,
        blank=True,
        verbose_name="Full Schema (Nullable)",
        help_text="Rich text field with all node types, allows null values",
    )

    basic_text_only = ProsemirrorModelField(
        schema=[],  # Only doc and paragraph nodes (core nodes)
        null=False,
        blank=True,
        verbose_name="Basic Text Only",
        help_text="Minimal text field with no formatting options",
        default=get_empty_doc,
    )

    text_formatting_only = ProsemirrorModelField(
        schema=[AllowedNodeType.STRONG, AllowedNodeType.ITALIC, AllowedNodeType.CODE],
        verbose_name="Text Formatting Only",
        help_text="Text with basic formatting (bold, italic, code), no block elements",
        default=get_default_formatted_text,
    )

    headings_and_blocks = ProsemirrorModelField(
        schema=[
            AllowedNodeType.HEADING,
            AllowedNodeType.BLOCKQUOTE,
            AllowedNodeType.HORIZONTAL_RULE,
            AllowedNodeType.STRONG,
            AllowedNodeType.ITALIC,
        ],
        null=True,
        blank=True,
        verbose_name="Headings and Blocks (Nullable)",
        help_text="Document structure with headings, quotes, and basic formatting",
    )

    code_content_nullable = ProsemirrorModelField(
        schema=[
            AllowedNodeType.CODE,
            AllowedNodeType.CODE_BLOCK,
            AllowedNodeType.STRONG,
            AllowedNodeType.ITALIC,
        ],
        null=True,
        verbose_name="Code Content (Nullable)",
        help_text="Technical content with inline and block code support",
    )
