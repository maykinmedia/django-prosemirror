"""Unit tests for ProsemirrorFormField."""

import json
from unittest.mock import Mock

from django import forms
from django.core.exceptions import ValidationError

import pytest
from prosemirror import Schema

from django_prosemirror.constants import DEFAULT_SETTINGS, EMPTY_DOC
from django_prosemirror.exceptions import DjangoProsemirrorException
from django_prosemirror.fields import ProsemirrorFieldDocument, ProsemirrorFormField
from django_prosemirror.schema import FULL, AllowedNodeType, construct_schema_from_spec
from django_prosemirror.widgets import ProsemirrorWidget
from tests.utils import assert_schemas_equivalent


class TestProsemirrorFormField:
    """Tests for ProsemirrorFormField class."""

    def test_init_with_default_schema(self):
        field = ProsemirrorFormField()

        assert field.schema_spec == FULL
        assert isinstance(field.schema, Schema)
        assert_schemas_equivalent(field.schema, FULL)
        assert isinstance(field.widget, ProsemirrorWidget)

    def test_init_with_custom_schema(self):
        schema_spec = [AllowedNodeType.HEADING, AllowedNodeType.STRONG]
        field = ProsemirrorFormField(schema=schema_spec)

        assert field.schema_spec == schema_spec
        assert field.schema is not None
        assert_schemas_equivalent(field.schema, schema_spec)

    def test_init_with_multiple_parameters(self):
        """Test field initialization with various optional parameters."""
        custom_encoder = Mock()
        custom_decoder = Mock()
        schema_spec = [AllowedNodeType.STRONG]

        field = ProsemirrorFormField(
            schema=schema_spec,
            required=False,
            help_text="Enter rich content",
            encoder=custom_encoder,
            decoder=custom_decoder,
        )

        assert field.required is False
        assert field.help_text == "Enter rich content"
        assert field.schema_spec == schema_spec
        assert_schemas_equivalent(field.schema, schema_spec)
        assert field.encoder is custom_encoder
        assert field.decoder is custom_decoder
        assert isinstance(field.widget, ProsemirrorWidget)

    def test_field_inherits_from_json_field(self):
        field = ProsemirrorFormField(schema=[AllowedNodeType.HEADING])

        assert isinstance(field, forms.JSONField)

    # Form field specific tests
    def test_prepare_value_with_prosemirror_document(self):
        schema_spec = [AllowedNodeType.HEADING]
        field = ProsemirrorFormField(schema=schema_spec)
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

    def test_to_python_with_valid_json_string(self):
        schema_spec = [AllowedNodeType.HEADING]
        field = ProsemirrorFormField(schema=schema_spec)
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

    def test_to_python_with_dict(self):
        schema_spec = [AllowedNodeType.HEADING]
        field = ProsemirrorFormField(schema=schema_spec)
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

    def test_to_python_with_none(self):
        schema_spec = [AllowedNodeType.HEADING]
        field = ProsemirrorFormField(schema=schema_spec)

        result = field.to_python(None)

        assert isinstance(result, ProsemirrorFieldDocument)
        assert result.doc is None

    def test_to_python_with_empty_string(self):
        schema_spec = [AllowedNodeType.HEADING]
        field = ProsemirrorFormField(schema=schema_spec)

        result = field.to_python("")

        assert isinstance(result, ProsemirrorFieldDocument)
        # Empty string gets parsed as None by parent JSONField
        assert result.doc is None

    def test_to_python_preserves_schema_in_document(self):
        schema_spec = [AllowedNodeType.BLOCKQUOTE]
        field = ProsemirrorFormField(schema=schema_spec)
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
        assert result.schema == field.schema

    def test_validate_with_valid_prosemirror_document(self):
        schema_spec = [AllowedNodeType.HEADING]
        field = ProsemirrorFormField(schema=schema_spec)
        schema = construct_schema_from_spec(schema_spec)
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

    def test_validate_with_invalid_value_type_raises_value_error(self):
        schema_spec = [AllowedNodeType.HEADING]
        field = ProsemirrorFormField(schema=schema_spec)

        with pytest.raises(ValueError, match="Expected"):
            field.validate({"type": "doc", "content": []})

    def test_validate_with_invalid_document_structure_raises_validation_error(self):
        schema_spec = [AllowedNodeType.HEADING]
        field = ProsemirrorFormField(schema=schema_spec)
        schema = construct_schema_from_spec(schema_spec)
        invalid_doc_data = {"invalid": "structure"}

        doc = ProsemirrorFieldDocument(invalid_doc_data, schema=schema)

        with pytest.raises(ValidationError):
            field.validate(doc)

    def test_validate_with_empty_document(self):
        schema_spec = []
        field = ProsemirrorFormField(schema=schema_spec)
        schema = construct_schema_from_spec(schema_spec)

        doc = ProsemirrorFieldDocument(EMPTY_DOC, schema=schema)

        # Should not raise any exception for valid empty document
        field.validate(doc)

    def test_full_form_field_workflow(self):
        """Test the complete workflow of form field processing."""
        schema_spec = [AllowedNodeType.STRONG, AllowedNodeType.ITALIC]
        field = ProsemirrorFormField(
            schema=schema_spec, classes=DEFAULT_SETTINGS["classes"]
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
                            "marks": [{"type": "strong", "attrs": {}}],
                            "text": "bold",
                        },
                        {"type": "text", "text": " and "},
                        {
                            "type": "text",
                            "marks": [{"type": "em", "attrs": {}}],
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

    @pytest.mark.parametrize(
        "schema_spec",
        [
            [],
            [AllowedNodeType.HEADING],
            [AllowedNodeType.STRONG, AllowedNodeType.ITALIC],
            [AllowedNodeType.BLOCKQUOTE, AllowedNodeType.CODE_BLOCK],
            FULL,
        ],
    )
    def test_different_schema_specs_create_valid_fields(self, schema_spec):
        field = ProsemirrorFormField(schema=schema_spec)

        assert field.schema is not None
        assert isinstance(field.widget, ProsemirrorWidget)

    # Invalid schema tests
    def test_init_with_invalid_schema_non_iterable_raises_exception(self):
        with pytest.raises(
            DjangoProsemirrorException, match="`spec` must be a collection"
        ):
            ProsemirrorFormField(
                schema="invalid_string",
                classes=DEFAULT_SETTINGS["classes"],
            )

    def test_init_with_invalid_schema_wrong_type_raises_exception(self):
        with pytest.raises(
            DjangoProsemirrorException, match="`spec` must be a collection"
        ):
            ProsemirrorFormField(
                schema=["invalid_string", "another_invalid"],
                classes=DEFAULT_SETTINGS["classes"],
            )

    def test_init_with_invalid_schema_none_raises_exception(self):
        with pytest.raises(
            DjangoProsemirrorException, match="`spec` must be a collection"
        ):
            ProsemirrorFormField(
                schema=None,
                classes=DEFAULT_SETTINGS["classes"],
            )
