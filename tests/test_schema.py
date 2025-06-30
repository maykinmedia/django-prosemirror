"""Tests for schema validation and construction logic."""

from django.core.exceptions import ValidationError

import pytest

from django_prosemirror.exceptions import DjangoProsemirrorException
from django_prosemirror.schema import (
    FULL,
    AllowedNodeType,
    construct_schema_from_spec,
    validate_doc,
)


class TestSchemaConstruction:
    """Tests for construct_schema_from_spec function."""

    def test_construct_schema_from_spec_with_valid_node_types(
        self,
    ):
        spec = [AllowedNodeType.HEADING, AllowedNodeType.STRONG]
        schema = construct_schema_from_spec(spec)

        expected_nodes = {"doc", "paragraph", "text", "heading"}
        expected_marks = {"strong"}

        assert set(schema.nodes.keys()) == expected_nodes
        assert set(schema.marks.keys()) == expected_marks

    def test_construct_schema_from_spec_with_empty_spec_creates_minimal_schema(
        self,
    ):
        spec = []
        schema = construct_schema_from_spec(spec)

        expected_nodes = {"doc", "paragraph", "text"}
        expected_marks = set()

        assert set(schema.nodes.keys()) == expected_nodes
        assert set(schema.marks.keys()) == expected_marks

    def test_construct_schema_from_spec_with_full_spec_includes_all_nodes_and_marks(
        self,
    ):
        schema = construct_schema_from_spec(FULL)

        expected_nodes = {
            # Core nodes
            "doc",
            "paragraph",
            "text",
            # Additional nodes
            "blockquote",
            "horizontal_rule",
            "heading",
            "code_block",
            "image",
            "hard_break",
            "ordered_list",
            "list_item",
            "unordered_list",
        }
        expected_marks = {"link", "em", "strong", "code", "strikethrough", "underline"}

        assert set(schema.nodes.keys()) == expected_nodes
        assert set(schema.marks.keys()) == expected_marks

    @pytest.mark.parametrize(
        "spec",
        [
            [AllowedNodeType.HEADING, "invalid_string"],
            None,
            False,
            True,
            object(),
            "literal",
            42,
        ],
    )
    def test_construct_schema_from_spec_with_non_allowed_node_type_items_raises(
        self, spec
    ):
        with pytest.raises(DjangoProsemirrorException) as exc_info:
            construct_schema_from_spec(spec)

        assert (
            str(exc_info.value)
            == "`spec` must be a collection of AllowedNodeType elements"
        )

    @pytest.mark.parametrize(
        "node_types",
        [
            [AllowedNodeType.HEADING],
            [AllowedNodeType.STRONG, AllowedNodeType.ITALIC],
            [AllowedNodeType.BLOCKQUOTE, AllowedNodeType.CODE_BLOCK],
            [AllowedNodeType.IMAGE, AllowedNodeType.LINK],
            [AllowedNodeType.HORIZONTAL_RULE, AllowedNodeType.HARD_BREAK],
        ],
    )
    def test_construct_schema_from_combinations_creates_valid_schemas_with_core_nodes(
        self, node_types
    ):
        schema = construct_schema_from_spec(node_types)

        # Build expected sets based on node_types
        expected_nodes = {"doc", "paragraph", "text"}  # Core nodes always present
        expected_marks = set()

        for node_type in node_types:
            if node_type.value in ["strong", "em", "code", "link"]:
                expected_marks.add(node_type.value)
            else:
                expected_nodes.add(node_type.value)

        assert set(schema.nodes.keys()) == expected_nodes
        assert set(schema.marks.keys()) == expected_marks


class TestDocumentValidation:
    """Tests for validate_doc function."""

    def test_validate_doc_with_full_document_passes_validation(self, full_document):
        schema = construct_schema_from_spec(FULL)

        # Should not raise any exception
        validate_doc(full_document, schema=schema)

    def test_validate_doc_with_minimal_valid_document_passes_validation(
        self,
    ):
        schema = construct_schema_from_spec([])
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

        # Should not raise any exception
        validate_doc(doc, schema=schema)

    def test_validate_doc_with_document_containing_subset_validation(
        self,
    ):
        schema = construct_schema_from_spec(
            [AllowedNodeType.HEADING, AllowedNodeType.STRONG, AllowedNodeType.ITALIC]
        )
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

    def test_validate_doc_with_non_dict_input_raises(
        self,
    ):
        schema = construct_schema_from_spec([])

        with pytest.raises(ValidationError) as exc_info:
            validate_doc("not a dict", schema=schema)

        assert exc_info.value.message == "Prosemirror document must be a dict"

    def test_validate_doc_with_empty_dict_raises(
        self,
    ):
        schema = construct_schema_from_spec([])

        with pytest.raises(ValidationError) as exc_info:
            validate_doc({}, schema=schema)

        assert exc_info.value.message == "Prosemirror document cannot be empty"

    def test_validate_doc_with_document_missing_type_field_raises(
        self,
    ):
        schema = construct_schema_from_spec([])
        doc = {"content": []}

        with pytest.raises(ValidationError) as exc_info:
            validate_doc(doc, schema=schema)

        assert exc_info.value.message == "Prosemirror document must have a 'type' field"

    def test_validate_doc_with_invalid_structure_raises_validation_error(
        self,
    ):
        schema = construct_schema_from_spec([])
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
        schema = construct_schema_from_spec([AllowedNodeType.STRONG])
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

    @pytest.mark.parametrize(
        "node_types,doc_content",
        [
            (
                [AllowedNodeType.BLOCKQUOTE],
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
                [AllowedNodeType.CODE_BLOCK],
                [
                    {
                        "type": "code_block",
                        "content": [{"type": "text", "text": "console.log('hello');"}],
                    }
                ],
            ),
            (
                [AllowedNodeType.HORIZONTAL_RULE],
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
        schema = construct_schema_from_spec(node_types)
        doc = {"type": "doc", "content": doc_content}

        # Should not raise any exception
        validate_doc(doc, schema=schema)

    def test_validate_with_missing_required_text_field_raises_validation_error(
        self,
    ):
        schema = construct_schema_from_spec([])
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
