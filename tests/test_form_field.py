"""Unit tests for ProsemirrorFormField."""

import json
from unittest.mock import Mock

from django import forms
from django.core.exceptions import ValidationError

import pytest

from django_prosemirror.config import ProsemirrorConfig
from django_prosemirror.constants import EMPTY_DOC
from django_prosemirror.fields import ProsemirrorFieldDocument, ProsemirrorFormField
from django_prosemirror.schema import MarkType, NodeType
from django_prosemirror.widgets import ProsemirrorWidget


def test_init_with_default_schema():
    field = ProsemirrorFormField()
    assert isinstance(field.config, ProsemirrorConfig)
    assert isinstance(field.widget, ProsemirrorWidget)


def test_params_are_accepted_and_passed_down():
    """Test field initialization with various optional parameters."""
    custom_encoder = Mock()
    custom_decoder = Mock()

    field = ProsemirrorFormField(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.CODE_BLOCK],
        allowed_mark_types=[MarkType.STRONG],
        required=False,
        help_text="Enter rich content",
        encoder=custom_encoder,
        decoder=custom_decoder,
    )

    assert field.required is False
    assert field.help_text == "Enter rich content"
    assert field.config.allowed_node_types == [NodeType.PARAGRAPH, NodeType.CODE_BLOCK]
    assert field.config.allowed_mark_types == [MarkType.STRONG]
    assert field.encoder is custom_encoder
    assert field.decoder is custom_decoder
    assert isinstance(field.widget, ProsemirrorWidget)


def test_field_inherits_from_json_field():
    field = ProsemirrorFormField(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING]
    )

    assert isinstance(field, forms.JSONField)


# Form field specific tests
def test_prepare_value_with_prosemirror_document():
    field = ProsemirrorFormField(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING]
    )
    doc_data = {
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "Title"}],
            }
        ],
    }

    # Test with dict directly since ProsemirrorFieldDocument isn't JSON serializable
    result = field.prepare_value(doc_data)

    # Should convert dict to JSON string
    expected_json = json.dumps(doc_data)
    assert result == expected_json


def test_to_python_with_valid_json_string():
    field = ProsemirrorFormField(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING]
    )
    doc_data = {
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "Title"}],
            }
        ],
    }
    json_string = json.dumps(doc_data)

    result = field.to_python(json_string)

    assert isinstance(result, ProsemirrorFieldDocument)
    assert result.doc == doc_data


def test_to_python_with_dict():
    field = ProsemirrorFormField(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING]
    )
    doc_data = {
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "Title"}],
            }
        ],
    }

    result = field.to_python(doc_data)

    assert isinstance(result, ProsemirrorFieldDocument)
    assert result.doc == doc_data


def test_to_python_with_none():
    field = ProsemirrorFormField(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING]
    )

    result = field.to_python(None)

    assert isinstance(result, ProsemirrorFieldDocument)
    assert result.doc is None


def test_to_python_with_empty_string():
    field = ProsemirrorFormField(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING]
    )

    result = field.to_python("")

    assert isinstance(result, ProsemirrorFieldDocument)
    # Empty string gets parsed as None by parent JSONField
    assert result.doc is None


def test_to_python_preserves_schema_in_document():
    field = ProsemirrorFormField(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.BLOCKQUOTE]
    )
    doc_data = {
        "type": "doc",
        "content": [
            {
                "type": "blockquote",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": "Quote"}],
                    }
                ],
            }
        ],
    }

    result = field.to_python(doc_data)

    assert isinstance(result, ProsemirrorFieldDocument)
    assert result.schema.spec.keys() == field.config.schema.spec.keys()


def test_validate_with_valid_prosemirror_document():
    field = ProsemirrorFormField(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING]
    )
    schema = field.config.schema
    doc_data = {
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "Valid Title"}],
            }
        ],
    }

    doc = ProsemirrorFieldDocument(doc_data, schema=schema)

    # Should not raise any exception
    field.validate(doc)


def test_validate_with_invalid_value_type_raises_value_error():
    field = ProsemirrorFormField(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING]
    )

    with pytest.raises(ValueError, match="Expected"):
        field.validate({"type": "doc", "content": []})


def test_validate_with_invalid_document_structure_raises_validation_error():
    field = ProsemirrorFormField(
        allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING]
    )
    schema = field.config.schema
    invalid_doc_data = {"invalid": "structure"}

    doc = ProsemirrorFieldDocument(invalid_doc_data, schema=schema)

    with pytest.raises(ValidationError):
        field.validate(doc)


def test_validate_with_empty_document():
    field = ProsemirrorFormField(
        allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
    )
    schema = field.config.schema

    doc = ProsemirrorFieldDocument(EMPTY_DOC, schema=schema)

    # Should not raise any exception for valid empty document
    field.validate(doc)


def test_full_form_field_workflow():
    """Test the complete workflow of form field processing."""
    field = ProsemirrorFormField(
        allowed_mark_types=[MarkType.STRONG, MarkType.ITALIC],
    )

    # Simulate form input as dict (what comes from JSON parsing)
    input_data = {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Normal "},
                    {
                        "type": "text",
                        "marks": [{"type": "strong"}],
                        "text": "bold",
                    },
                    {"type": "text", "text": " and "},
                    {
                        "type": "text",
                        "marks": [{"type": "em"}],
                        "text": "italic",
                    },
                    {"type": "text", "text": " text"},
                ],
            }
        ],
    }

    # Process through form field
    python_value = field.to_python(input_data)
    field.validate(python_value)

    # Verify the result
    assert isinstance(python_value, ProsemirrorFieldDocument)
    assert python_value.doc == input_data
    assert (
        python_value.html
        == "<p>Normal <strong>bold</strong> and <em>italic</em> text</p>"
    )


# Invalid schema tests
def test_init_with_invalid_node_types_raises_exception():
    with pytest.raises(TypeError):
        ProsemirrorFormField(
            allowed_node_types="invalid_string",
        )


def test_init_with_invalid_mark_types_raises_exception():
    with pytest.raises(TypeError):
        ProsemirrorFormField(
            allowed_mark_types="invalid_string",
        )
