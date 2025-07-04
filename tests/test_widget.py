"""Tests for ProsemirrorWidget functionality."""

import json

from django_prosemirror.constants import DEFAULT_SETTINGS
from django_prosemirror.schema import MarkType, NodeType
from django_prosemirror.widgets import ProsemirrorWidget


def test_widget_initialization():
    """Test that ProsemirrorWidget initializes correctly with schema."""
    widget = ProsemirrorWidget(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING],
        allowed_mark_types=[MarkType.STRONG],
    )

    assert widget.config.allowed_node_types == [NodeType.PARAGRAPH, NodeType.HEADING]
    assert widget.config.allowed_mark_types == [MarkType.STRONG]
    assert widget.template_name == "widget.html"


def test_widget_get_context_includes_schema_and_doc():
    """Test that get_context adds schema to context."""
    widget = ProsemirrorWidget(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING],
        allowed_mark_types=[MarkType.STRONG, MarkType.ITALIC],
        tag_to_classes={"p": "foo"},
        history=False,
    )

    # Test get_context method
    context = widget.get_context(
        name="test_field", value={"type": "doc", "content": []}, attrs={"id": "test-id"}
    )

    assert context["schema"] == json.dumps(
        [
            el.value
            for el in [
                NodeType.PARAGRAPH,
                NodeType.HEADING,
                MarkType.STRONG,
                MarkType.ITALIC,
            ]
        ]
    )
    assert context["classes"] == json.dumps(
        {"p": "foo"} | DEFAULT_SETTINGS["tag_to_classes"]
    )
    assert context["history"] == "false"
