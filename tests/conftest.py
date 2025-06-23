from django.contrib.auth.models import User

import pytest

from django_prosemirror.schema import ProsemirrorDocument


@pytest.fixture
def admin_user():
    """Create an admin user for testing."""
    return User.objects.create_superuser(
        username="admin", email="admin@example.com", password="secret"
    )


@pytest.fixture
def full_document() -> ProsemirrorDocument:
    """A comprehensive document that includes every node type at least once."""
    return {
        "type": "doc",
        "content": [
            # Heading with various levels
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "Main Title"}],
            },
            {
                "type": "heading",
                "attrs": {"level": 2},
                "content": [{"type": "text", "text": "Subtitle"}],
            },
            # Paragraph with various marks
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "This is a paragraph with "},
                    {
                        "type": "text",
                        "marks": [{"type": "strong"}],
                        "text": "bold text",
                    },
                    {"type": "text", "text": ", "},
                    {"type": "text", "marks": [{"type": "em"}], "text": "italic text"},
                    {"type": "text", "text": ", and "},
                    {
                        "type": "text",
                        "marks": [{"type": "code"}],
                        "text": "inline code",
                    },
                    {"type": "text", "text": ". Here's a "},
                    {
                        "type": "text",
                        "marks": [
                            {
                                "type": "link",
                                "attrs": {
                                    "href": "https://example.com",
                                    "title": "Example",
                                },
                            }
                        ],
                        "text": "link",
                    },
                    {"type": "text", "text": "."},
                ],
            },
            # Blockquote
            {
                "type": "blockquote",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {"type": "text", "text": "This is a quoted paragraph."}
                        ],
                    }
                ],
            },
            # Code block
            {
                "type": "code_block",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "function hello() {\n  console.log('Hello, world!');\n}"
                        ),
                    }
                ],
            },
            # Paragraph with image and hard break
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Here's an image: "},
                    {
                        "type": "image",
                        "attrs": {
                            "src": "https://example.com/image.jpg",
                            "alt": "Example image",
                            "title": "An example image",
                        },
                    },
                    {"type": "hard_break"},
                    {"type": "text", "text": "Text after line break."},
                ],
            },
            # Horizontal rule
            {"type": "horizontal_rule"},
            # Final paragraph
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "This document contains all node types."}
                ],
            },
        ],
    }
