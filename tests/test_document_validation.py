"""Tests for schema validation and construction logic."""

from django.core.exceptions import ValidationError

import pytest

from django_prosemirror.config import ProsemirrorConfig
from django_prosemirror.schema import (
    MAX_ERROR_TEXT_LENGTH,
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


class TestUnsafeUrlValidation:
    """Tests for rejecting URLs a browser would treat as executable."""

    @staticmethod
    def _link_doc(href: str) -> dict:
        return {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "click me",
                            "marks": [
                                {
                                    "type": "link",
                                    "attrs": {"href": href, "title": None},
                                }
                            ],
                        }
                    ],
                }
            ],
        }

    @property
    def _link_schema(self):
        return ProsemirrorConfig(
            allowed_node_types=[
                NodeType.PARAGRAPH,
                NodeType.BULLET_LIST,
                NodeType.LIST_ITEM,
            ],
            allowed_mark_types=[MarkType.LINK],
        ).schema

    @pytest.mark.parametrize(
        "href",
        [
            "javascript:alert(1)",
            "JaVaScRiPt:alert(1)",
            "java\nscript:alert(1)",
            "  javascript:alert(1)",
            "data:text/html;base64,PHNjcmlwdD48L3NjcmlwdD4=",
            "vbscript:msgbox(1)",
        ],
    )
    def test_validate_doc_with_unsafe_link_href_raises_validation_error(self, href):
        with pytest.raises(ValidationError) as exc_info:
            validate_doc(self._link_doc(href), schema=self._link_schema)

        assert "link.href" in str(exc_info.value)

    def test_validate_doc_with_unsafe_link_href_does_not_echo_the_url(self):
        with pytest.raises(ValidationError) as exc_info:
            validate_doc(
                self._link_doc("javascript:alert(1)"), schema=self._link_schema
            )

        assert "alert(1)" not in str(exc_info.value)

    def test_validate_doc_with_unsafe_link_href_names_the_link_text(self):
        with pytest.raises(ValidationError) as exc_info:
            validate_doc(
                self._link_doc("javascript:alert(1)"), schema=self._link_schema
            )

        assert 'on "click me"' in str(exc_info.value)

    def test_validate_doc_with_unsafe_link_href_truncates_long_link_text(self):
        doc = self._link_doc("javascript:alert(1)")
        doc["content"][0]["content"][0]["text"] = "a" * 200

        with pytest.raises(ValidationError) as exc_info:
            validate_doc(doc, schema=self._link_schema)

        message = str(exc_info.value)
        assert f'on "{"a" * MAX_ERROR_TEXT_LENGTH}…"' in message
        assert "a" * (MAX_ERROR_TEXT_LENGTH + 1) not in message

    def test_validate_doc_with_unsafe_link_href_on_blank_text_omits_location(self):
        doc = self._link_doc("javascript:alert(1)")
        doc["content"][0]["content"][0]["text"] = "   "

        with pytest.raises(ValidationError) as exc_info:
            validate_doc(doc, schema=self._link_schema)

        assert " on " not in str(exc_info.value)

    @pytest.mark.parametrize(
        "href",
        [
            "https://example.com",
            "http://example.com/path?q=1",
            "mailto:someone@example.com",
            "tel:+31612345678",
            "/relative/path",
            "#fragment",
        ],
    )
    def test_validate_doc_with_safe_link_href_passes_validation(self, href):
        # Should not raise
        validate_doc(self._link_doc(href), schema=self._link_schema)

    def test_validate_doc_with_unsafe_link_href_in_nested_list_raises(self):
        doc = {
            "type": "doc",
            "content": [
                {
                    "type": "bullet_list",
                    "content": [
                        {
                            "type": "list_item",
                            "content": [
                                self._link_doc("javascript:alert(1)")["content"][0]
                            ],
                        }
                    ],
                }
            ],
        }

        with pytest.raises(ValidationError) as exc_info:
            validate_doc(doc, schema=self._link_schema)

        assert "link.href" in str(exc_info.value)

    def test_validate_doc_with_unsafe_filer_image_src_raises_validation_error(self):
        schema = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH, NodeType.FILER_IMAGE],
            allowed_mark_types=[],
        ).schema
        doc = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "filer_image",
                            "attrs": {
                                "src": "javascript:alert(1)",
                                "alt": "",
                                "title": None,
                                "imageId": None,
                                "caption": "",
                            },
                        }
                    ],
                }
            ],
        }

        with pytest.raises(ValidationError) as exc_info:
            validate_doc(doc, schema=schema)

        assert "filer_image.src" in str(exc_info.value)
