"""Tests for schema validation and construction logic."""

from django.core.exceptions import ValidationError

import pytest

from django_prosemirror.config import ProsemirrorConfig
from django_prosemirror.schema import (
    MarkType,
    NodeType,
    validate_doc,
)


class TestDocumentValidation:
    """Tests for validate_doc function."""

    def test_validate_doc_with_full_document_passes_validation(self, full_document):
        config = ProsemirrorConfig()

        # Should not raise
        validate_doc(full_document, schema=config.schema)

    def test_validate_doc_with_minimal_valid_document_passes_validation(
        self,
    ):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema
        doc = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "Hello world",
                        }
                    ],
                }
            ],
        }

        # Should not raise
        validate_doc(doc, schema=schema)

    def test_validate_doc_with_document_containing_subset_validation(
        self,
    ):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING],
            allowed_mark_types=[MarkType.STRONG, MarkType.ITALIC],
        )
        schema = config.schema
        doc = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "Title"}],
                },
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "marks": [{"type": "strong"}], "text": "Bold"},
                        {"type": "text", "text": " and "},
                        {"type": "text", "marks": [{"type": "em"}], "text": "italic"},
                    ],
                },
            ],
        }

        # Should not raise any exception
        validate_doc(doc, schema=schema)

    @pytest.mark.parametrize(
        "node_types,doc_content",
        [
            (
                [NodeType.BLOCKQUOTE],
                [
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
            ),
            (
                [NodeType.CODE_BLOCK],
                [
                    {
                        "type": "code_block",
                        "content": [{"type": "text", "text": "console.log('hello');"}],
                    }
                ],
            ),
            (
                [NodeType.HORIZONTAL_RULE],
                [
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": "Before"}],
                    },
                    {"type": "horizontal_rule"},
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": "After"}],
                    },
                ],
            ),
        ],
    )
    def test_validate_with_subset_of_nodes_passes_validation(
        self, node_types, doc_content
    ):
        node_types_with_paragraph = (
            [NodeType.PARAGRAPH] + node_types if node_types else [NodeType.PARAGRAPH]
        )
        config = ProsemirrorConfig(
            allowed_node_types=node_types_with_paragraph, allowed_mark_types=[]
        )
        schema = config.schema
        doc = {"type": "doc", "content": doc_content}

        # Should not raise any exception
        validate_doc(doc, schema=schema)

    def test_validate_doc_with_non_dict_input_raises(
        self,
    ):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema

        with pytest.raises(ValidationError) as exc_info:
            validate_doc("not a dict", schema=schema)

        assert exc_info.value.message == "Prosemirror document must be a dict"

    def test_validate_doc_with_empty_dict_raises(
        self,
    ):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema

        with pytest.raises(ValidationError) as exc_info:
            validate_doc({}, schema=schema)

        assert exc_info.value.message == "Prosemirror document cannot be empty"

    def test_validate_doc_with_document_missing_type_field_raises(
        self,
    ):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema
        doc = {"content": []}

        with pytest.raises(ValidationError) as exc_info:
            validate_doc(doc, schema=schema)

        assert exc_info.value.message == "Prosemirror document must have a 'type' field"

    def test_validate_doc_with_invalid_structure_raises_validation_error(
        self,
    ):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema
        doc = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": "invalid_content_should_be_array",  # Should be array
                }
            ],
        }

        with pytest.raises(ValidationError) as exc_info:
            validate_doc(doc, schema=schema)

        assert "Invalid prosemirror document" in str(exc_info.value)

    def test_validate_doc_with_document_containing_unknown_node_type_raises(
        self,
    ):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH],
            allowed_mark_types=[MarkType.STRONG],
        )
        schema = config.schema
        doc = {
            "type": "doc",
            "content": [
                {
                    "type": "unknown_node_type",
                    "content": [{"type": "text", "text": "Title"}],
                }
            ],
        }

        with pytest.raises(ValidationError) as exc_info:
            validate_doc(doc, schema=schema)

        assert "Invalid prosemirror document" in str(exc_info.value)

    def test_validate_with_missing_required_text_field_raises_validation_error(
        self,
    ):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
        )
        schema = config.schema
        doc = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            # Missing required 'text' field for text node
                            "marks": [],
                        }
                    ],
                }
            ],
        }

        # prosemirror-py raises KeyError for missing 'text' field, which should be
        # caught and re-raised as a ValidationError
        with pytest.raises(ValidationError):
            validate_doc(doc, schema=schema)
