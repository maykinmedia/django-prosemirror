from unittest.mock import Mock

from django.core.exceptions import ValidationError
from django.db import models

import pytest
from prosemirror import Schema

from django_prosemirror.fields import ProsemirrorFormField, ProsemirrorModelField
from django_prosemirror.schema import MarkType, NodeType


class TestProsemirrorModelField:
    def test_init_with_default_schema(self):
        field = ProsemirrorModelField()

        assert field.allowed_node_types is None  # Defaults to all
        assert field.allowed_mark_types is None  # Defaults to all
        assert isinstance(field.schema, Schema)
        assert field.description == "Prosemirror content stored as JSON"

    def test_init_with_custom_schema(self):
        field = ProsemirrorModelField(
            allowed_node_types=[NodeType.HEADING], allowed_mark_types=[MarkType.STRONG]
        )

        assert field.allowed_node_types == [NodeType.HEADING]
        assert field.allowed_mark_types == [MarkType.STRONG]
        assert field.schema is not None
        assert "heading" in field.schema.nodes
        assert "strong" in field.schema.marks

    def test_init_with_multiple_parameters(self):
        def valid_default():
            return {"type": "doc", "content": []}

        custom_encoder = Mock()
        custom_decoder = Mock()

        field = ProsemirrorModelField(
            verbose_name="Rich Content",
            name="rich_content",
            default=valid_default,
            encoder=custom_encoder,
            decoder=custom_decoder,
        )

        assert field.verbose_name == "Rich Content"
        assert field.name == "rich_content"
        assert field.default is valid_default
        assert field.encoder is custom_encoder
        assert field.decoder is custom_decoder
        assert field.schema is not None

    def test_formfield_with_custom_arguments(self):
        field = ProsemirrorModelField()
        form_field = field.formfield(required=False, help_text="Custom help")

        assert isinstance(form_field, ProsemirrorFormField)
        assert form_field.required is False
        assert form_field.help_text == "Custom help"

    def test_init_with_invalid_default_non_callable_raises_value_error(self):
        with pytest.raises(ValueError, match="`default` must be a callable"):
            ProsemirrorModelField(
                default={"type": "doc", "content": []}  # type: ignore
            )

    def test_init_with_invalid_default_callable_raises_validation_error(self):
        with pytest.raises(ValidationError, match="according to your schema"):
            ProsemirrorModelField(default=lambda: {"invalid": "document"})

    def test_formfield_returns_prosemirror_form_field(self):
        field = ProsemirrorModelField(allowed_node_types=[NodeType.HEADING])
        form_field = field.formfield()

        assert isinstance(form_field, ProsemirrorFormField)
        # Form field creates its own schema from the spec, so compare the schema specs
        # Check that the form field schema contains the expected elements
        assert "heading" in form_field.schema.nodes

    def test_field_inherits_from_json_field(self):
        field = ProsemirrorModelField()

        assert isinstance(field, models.JSONField)

    def test_init_validates_default_against_schema(self):
        valid_doc = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "Title"}],
                }
            ],
        }
        mock_default = Mock(return_value=valid_doc)

        field = ProsemirrorModelField(
            allowed_node_types=[NodeType.HEADING], default=mock_default
        )

        # Check that the field schema contains the expected elements
        assert "heading" in field.schema.nodes
        assert field.default is mock_default
        mock_default.assert_called_once()

    def test_init_with_default_invalid_for_minimal_schema_raises_validation_error(
        self, full_document
    ):
        with pytest.raises(ValidationError, match="according to your schema"):
            ProsemirrorModelField(
                allowed_node_types=[],  # Minimal schema - no rich content allowed
                allowed_mark_types=[],
                default=lambda: full_document,
            )

    def test_init_with_invalid_node_types_raises_exception(self):
        with pytest.raises(TypeError):
            ProsemirrorModelField(allowed_node_types="invalid_string")

    def test_init_with_invalid_mark_types_raises_exception(self):
        with pytest.raises(TypeError):
            ProsemirrorModelField(allowed_mark_types="invalid_string")
