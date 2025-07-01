"""Tests for schema validation and construction logic."""

from django.core.exceptions import ValidationError

import pytest

from django_prosemirror.schema import (
    MarkType,
    NodeType,
    SchemaFactory,
    validate_doc,
)


class TestSchemaConstruction:
    """Tests for SchemaFactory.create_schema function."""

    def test_create_schema_with_valid_node_and_mark_types(
        self,
    ):
        schema = SchemaFactory.create_schema(
            allowed_node_types=[NodeType.HEADING], allowed_mark_types=[MarkType.STRONG]
        )

        expected_nodes = {"doc", "paragraph", "text", "heading"}
        expected_marks = {"strong"}

        assert set(schema.nodes.keys()) == expected_nodes
        assert set(schema.marks.keys()) == expected_marks

    def test_create_schema_with_empty_spec_creates_minimal_schema(
        self,
    ):
        schema = SchemaFactory.create_schema(
            allowed_node_types=[], allowed_mark_types=[]
        )

        expected_nodes = {"doc", "paragraph", "text"}
        expected_marks = set()

        assert set(schema.nodes.keys()) == expected_nodes
        assert set(schema.marks.keys()) == expected_marks

    def test_create_schema_with_all_types_includes_all_nodes_and_marks(
        self,
    ):
        schema = SchemaFactory.create_schema()

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

    def test_create_schema_with_invalid_node_types_raises(self):
        with pytest.raises(TypeError):
            SchemaFactory.create_schema(
                allowed_node_types=[NodeType.HEADING, "invalid_string"]
            )

    @pytest.mark.parametrize(
        "node_types,mark_types",
        [
            ([NodeType.HEADING], []),
            ([], [MarkType.STRONG, MarkType.ITALIC]),
            ([NodeType.BLOCKQUOTE, NodeType.CODE_BLOCK], []),
            ([NodeType.IMAGE], [MarkType.LINK]),
            ([NodeType.HORIZONTAL_RULE, NodeType.HARD_BREAK], []),
        ],
    )
    def test_create_schema_from_combinations_creates_valid_schemas_with_core_nodes(
        self, node_types, mark_types
    ):
        schema = SchemaFactory.create_schema(
            allowed_node_types=node_types, allowed_mark_types=mark_types
        )

        # Build expected sets based on node_types and mark_types
        expected_nodes = {"doc", "paragraph", "text"}  # Core nodes always present
        expected_marks = set()

        for node_type in node_types:
            expected_nodes.add(node_type.value)

        for mark_type in mark_types:
            expected_marks.add(mark_type.value)

        assert set(schema.nodes.keys()) == expected_nodes
        assert set(schema.marks.keys()) == expected_marks


class TestDocumentValidation:
    """Tests for validate_doc function."""

    def test_validate_doc_with_full_document_passes_validation(self, full_document):
        schema = SchemaFactory.create_schema()

        # Should not raise any exception
        validate_doc(full_document, schema=schema)

    def test_validate_doc_with_minimal_valid_document_passes_validation(
        self,
    ):
        schema = SchemaFactory.create_schema(
            allowed_node_types=[], allowed_mark_types=[]
        )
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
        schema = SchemaFactory.create_schema(
            allowed_node_types=[NodeType.HEADING],
            allowed_mark_types=[MarkType.STRONG, MarkType.ITALIC],
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
        schema = SchemaFactory.create_schema(
            allowed_node_types=[], allowed_mark_types=[]
        )

        with pytest.raises(ValidationError) as exc_info:
            validate_doc("not a dict", schema=schema)

        assert exc_info.value.message == "Prosemirror document must be a dict"

    def test_validate_doc_with_empty_dict_raises(
        self,
    ):
        schema = SchemaFactory.create_schema(
            allowed_node_types=[], allowed_mark_types=[]
        )

        with pytest.raises(ValidationError) as exc_info:
            validate_doc({}, schema=schema)

        assert exc_info.value.message == "Prosemirror document cannot be empty"

    def test_validate_doc_with_document_missing_type_field_raises(
        self,
    ):
        schema = SchemaFactory.create_schema(
            allowed_node_types=[], allowed_mark_types=[]
        )
        doc = {"content": []}

        with pytest.raises(ValidationError) as exc_info:
            validate_doc(doc, schema=schema)

        assert exc_info.value.message == "Prosemirror document must have a 'type' field"

    def test_validate_doc_with_invalid_structure_raises_validation_error(
        self,
    ):
        schema = SchemaFactory.create_schema(
            allowed_node_types=[], allowed_mark_types=[]
        )
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
        schema = SchemaFactory.create_schema(
            allowed_node_types=[], allowed_mark_types=[MarkType.STRONG]
        )
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
        schema = SchemaFactory.create_schema(
            allowed_node_types=node_types, allowed_mark_types=[]
        )
        doc = {"type": "doc", "content": doc_content}

        # Should not raise any exception
        validate_doc(doc, schema=schema)

    def test_validate_with_missing_required_text_field_raises_validation_error(
        self,
    ):
        schema = SchemaFactory.create_schema(
            allowed_node_types=[], allowed_mark_types=[]
        )
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
