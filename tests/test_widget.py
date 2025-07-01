"""Tests for ProsemirrorWidget functionality."""

import json

import pytest

from django_prosemirror.schema import MarkType, NodeType
from django_prosemirror.widgets import ProsemirrorWidget


def test_widget_initialization():
    """Test that ProsemirrorWidget initializes correctly with schema."""
    widget = ProsemirrorWidget(
        allowed_node_types=[NodeType.HEADING], allowed_mark_types=[MarkType.STRONG]
    )

    assert widget.allowed_node_types == [NodeType.HEADING]
    assert widget.allowed_mark_types == [MarkType.STRONG]
    assert widget.template_name == "widget.html"


def test_widget_initialization_full_schema():
    """Test widget initialization with full schema."""
    widget = ProsemirrorWidget()  # Defaults to full schema

    assert widget.allowed_node_types is None  # Defaults to all
    assert widget.allowed_mark_types is None  # Defaults to all


def test_widget_get_context():
    """Test that get_context adds schema to context."""
    widget = ProsemirrorWidget(
        allowed_node_types=[NodeType.HEADING],
        allowed_mark_types=[MarkType.STRONG, MarkType.ITALIC],
    )

    # Test get_context method
    context = widget.get_context(
        name="test_field", value={"type": "doc", "content": []}, attrs={"id": "test-id"}
    )

    # Should have schema in context
    assert "schema" in context

    # Schema should be JSON serialized
    schema_json = context["schema"]
    assert isinstance(schema_json, str)

    # Parse the JSON to verify content - should contain both nodes and marks
    parsed_schema = json.loads(schema_json)
    assert "nodes" in parsed_schema
    assert "marks" in parsed_schema


def test_widget_get_context_preserves_parent_context():
    """Test that get_context preserves context from parent Widget."""
    widget = ProsemirrorWidget(allowed_node_types=[NodeType.HEADING])

    context = widget.get_context(
        name="test_field", value=None, attrs={"id": "field-id", "class": "form-control"}
    )

    # Should preserve parent widget context structure
    assert "widget" in context
    assert context["widget"]["name"] == "test_field"
    assert context["widget"]["value"] is None
    assert context["widget"]["attrs"]["id"] == "field-id"
    assert context["widget"]["attrs"]["class"] == "form-control"

    # Should add our schema
    assert "schema" in context
    parsed_schema = json.loads(context["schema"])
    assert "nodes" in parsed_schema
    assert "heading" in parsed_schema["nodes"]


def test_widget_with_empty_schema():
    """Test widget behavior with minimal schema."""
    widget = ProsemirrorWidget(allowed_node_types=[], allowed_mark_types=[])

    context = widget.get_context("test_field", None, {})

    # Should handle empty schema gracefully
    assert "schema" in context
    parsed_schema = json.loads(context["schema"])
    assert "nodes" in parsed_schema
    assert "marks" in parsed_schema


def test_widget_schema_serialization():
    """Test that schema enum values are correctly serialized."""
    # Test various node types to ensure they serialize to correct string values
    node_test_cases = [
        (NodeType.HEADING, "heading"),
        (NodeType.BLOCKQUOTE, "blockquote"),
    ]

    mark_test_cases = [
        (MarkType.STRONG, "strong"),
        (MarkType.ITALIC, "em"),
        (MarkType.CODE, "code"),
        (MarkType.LINK, "link"),
    ]

    for node_type, expected_value in node_test_cases:
        widget = ProsemirrorWidget(allowed_node_types=[node_type])
        context = widget.get_context("test", None, {})

        parsed_schema = json.loads(context["schema"])
        assert expected_value in parsed_schema["nodes"]

    for mark_type, expected_value in mark_test_cases:
        widget = ProsemirrorWidget(allowed_mark_types=[mark_type])
        context = widget.get_context("test", None, {})

        parsed_schema = json.loads(context["schema"])
        assert expected_value in parsed_schema["marks"]


def test_widget_with_args_and_kwargs():
    """Test widget initialization with additional args and kwargs."""
    # Test with additional kwargs that should be passed to parent Widget
    widget = ProsemirrorWidget(
        allowed_node_types=[NodeType.HEADING],
        attrs={"class": "custom-widget"},
    )

    assert widget.allowed_node_types == [NodeType.HEADING]

    # Test that it can render context without errors
    context = widget.get_context("test", None, {"id": "test-id"})
    assert "schema" in context
    assert context["widget"]["attrs"]["id"] == "test-id"


def test_widget_value_handling():
    """Test that widget handles different value types appropriately."""
    widget = ProsemirrorWidget(
        allowed_node_types=[NodeType.HEADING], allowed_mark_types=[MarkType.STRONG]
    )

    # Test with None value
    context = widget.get_context("test", None, {})
    assert context["widget"]["value"] is None

    # Test with dict value (ProseMirror document)
    # Note: Django Widget base class converts dict values to string representation
    doc_value = {
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "Title"}],
            }
        ],
    }
    context = widget.get_context("test", doc_value, {})
    # Django Widget converts dict values to strings in the context
    assert context["widget"]["value"] == str(doc_value)

    # Test with string value (JSON)
    json_value = '{"type": "doc", "content": []}'
    context = widget.get_context("test", json_value, {})
    assert context["widget"]["value"] == json_value


@pytest.mark.parametrize(
    "node_types,mark_types,expected_node_count,expected_mark_count",
    [
        ([NodeType.HEADING], [], 1, 0),
        ([NodeType.HEADING], [MarkType.STRONG], 1, 1),
        (
            [NodeType.HEADING, NodeType.BLOCKQUOTE],
            [MarkType.STRONG, MarkType.ITALIC],
            2,
            2,
        ),
        (None, None, None, None),  # Full schema - we'll check it has many types
    ],
)
def test_widget_schema_length(
    node_types, mark_types, expected_node_count, expected_mark_count
):
    """Test widget handles schemas of different lengths correctly."""
    widget = ProsemirrorWidget(
        allowed_node_types=node_types, allowed_mark_types=mark_types
    )
    context = widget.get_context("test", None, {})

    parsed_schema = json.loads(context["schema"])

    if expected_node_count is None:  # Full schema case
        assert len(parsed_schema["nodes"]) > 5  # Should have many node types
        assert len(parsed_schema["marks"]) > 3  # Should have many mark types
    else:
        # +3 for core nodes: doc, paragraph, text
        assert len(parsed_schema["nodes"]) == expected_node_count + 3
        assert len(parsed_schema["marks"]) == expected_mark_count
