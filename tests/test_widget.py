"""Tests for ProsemirrorWidget functionality."""

import json

import pytest

from django_prosemirror.schema import FULL, AllowedNodeType
from django_prosemirror.widgets import ProsemirrorWidget


def test_widget_initialization():
    """Test that ProsemirrorWidget initializes correctly with schema."""
    schema = [AllowedNodeType.HEADING, AllowedNodeType.STRONG]
    widget = ProsemirrorWidget(schema=schema)

    assert widget.schema == schema
    assert widget.template_name == "widget.html"


def test_widget_initialization_full_schema():
    """Test widget initialization with full schema."""
    widget = ProsemirrorWidget(schema=FULL)

    assert widget.schema == FULL
    assert len(widget.schema) > 5  # FULL schema should have many node types


def test_widget_get_context():
    """Test that get_context adds schema to context."""
    schema = [AllowedNodeType.HEADING, AllowedNodeType.STRONG, AllowedNodeType.ITALIC]
    widget = ProsemirrorWidget(schema=schema)

    # Test get_context method
    context = widget.get_context(
        name="test_field", value={"type": "doc", "content": []}, attrs={"id": "test-id"}
    )

    # Should have schema in context
    assert "schema" in context

    # Schema should be JSON serialized
    schema_json = context["schema"]
    assert isinstance(schema_json, str)

    # Parse the JSON to verify content
    parsed_schema = json.loads(schema_json)
    expected_values = ["heading", "strong", "em"]  # .value of each enum
    assert parsed_schema == expected_values


def test_widget_get_context_preserves_parent_context():
    """Test that get_context preserves context from parent Widget."""
    schema = [AllowedNodeType.HEADING]
    widget = ProsemirrorWidget(schema=schema)

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
    assert parsed_schema == ["heading"]


def test_widget_with_empty_schema():
    """Test widget behavior with minimal schema."""
    schema = []  # Empty schema
    widget = ProsemirrorWidget(schema=schema)

    context = widget.get_context("test_field", None, {})

    # Should handle empty schema gracefully
    assert "schema" in context
    parsed_schema = json.loads(context["schema"])
    assert parsed_schema == []


def test_widget_schema_serialization():
    """Test that schema enum values are correctly serialized."""
    # Test various node types to ensure they serialize to correct string values
    test_cases = [
        (AllowedNodeType.HEADING, "heading"),
        (AllowedNodeType.STRONG, "strong"),
        (AllowedNodeType.ITALIC, "em"),
        (AllowedNodeType.BLOCKQUOTE, "blockquote"),
        (AllowedNodeType.CODE, "code"),
        (AllowedNodeType.LINK, "link"),
    ]

    for node_type, expected_value in test_cases:
        widget = ProsemirrorWidget(schema=[node_type])
        context = widget.get_context("test", None, {})

        parsed_schema = json.loads(context["schema"])
        assert parsed_schema == [expected_value]


def test_widget_with_args_and_kwargs():
    """Test widget initialization with additional args and kwargs."""
    schema = [AllowedNodeType.HEADING]

    # Test with additional kwargs that should be passed to parent Widget
    widget = ProsemirrorWidget(
        schema=schema,
        attrs={"class": "custom-widget"},
    )

    assert widget.schema == schema

    # Test that it can render context without errors
    context = widget.get_context("test", None, {"id": "test-id"})
    assert "schema" in context
    assert context["widget"]["attrs"]["id"] == "test-id"


def test_widget_value_handling():
    """Test that widget handles different value types appropriately."""
    schema = [AllowedNodeType.HEADING, AllowedNodeType.STRONG]
    widget = ProsemirrorWidget(schema=schema)

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
    "schema_input,expected_count",
    [
        ([AllowedNodeType.HEADING], 1),
        ([AllowedNodeType.HEADING, AllowedNodeType.STRONG], 2),
        ([AllowedNodeType.HEADING, AllowedNodeType.STRONG, AllowedNodeType.ITALIC], 3),
        (FULL, len(FULL)),  # Full schema should have all available types
    ],
)
def test_widget_schema_length(schema_input, expected_count):
    """Test widget handles schemas of different lengths correctly."""
    widget = ProsemirrorWidget(schema=schema_input)
    context = widget.get_context("test", None, {})

    parsed_schema = json.loads(context["schema"])
    assert len(parsed_schema) == expected_count
