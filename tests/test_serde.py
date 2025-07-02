"""Tests for serialization and deserialization functions."""

import pytest

from django_prosemirror.config import ProsemirrorConfig
from django_prosemirror.constants import EMPTY_DOC
from django_prosemirror.schema import MarkType, NodeType
from django_prosemirror.serde import doc_to_html, html_to_doc


class TestDocToHtml:

    def test_full_document_fixture_contains_all_node_and_mark_types(
        self, full_document
    ):
        """Test that full_document fixture contains all NodeType and MarkType values."""
        def extract_types_from_document(doc, node_types=None, mark_types=None):
            """Recursively extract all node and mark types from a document."""
            if node_types is None:
                node_types = set()
            if mark_types is None:
                mark_types = set()
            
            if isinstance(doc, dict) and "type" in doc:
                node_types.add(doc["type"])
                
                # Extract mark types from marks
                if "marks" in doc:
                    for mark in doc["marks"]:
                        if isinstance(mark, dict) and "type" in mark:
                            mark_types.add(mark["type"])
                
                # Recursively process content
                if "content" in doc:
                    for item in doc["content"]:
                        extract_types_from_document(item, node_types, mark_types)
            
            return node_types, mark_types
        
        found_node_types, found_mark_types = extract_types_from_document(full_document)
        
        # Expected node types (all NodeType enum values converted to string values)
        expected_node_types = {node_type.value for node_type in NodeType}
        expected_node_types.update({"doc", "text"})  # Core ProseMirror types
        
        # Expected mark types (all MarkType enum values converted to string values)
        expected_mark_types = {mark_type.value for mark_type in MarkType}
        
        # Verify all expected node types are present
        missing_node_types = expected_node_types - found_node_types
        assert not missing_node_types, (
            f"Missing node types in full_document: {missing_node_types}"
        )
        
        # Verify all expected mark types are present
        missing_mark_types = expected_mark_types - found_mark_types
        assert not missing_mark_types, (
            f"Missing mark types in full_document: {missing_mark_types}"
        )

        
    def test_full_document_produces_expected_html_output(self, full_document):
        config = ProsemirrorConfig()
        html = doc_to_html(full_document, schema=config.schema)

        expected_html = (
            "<h1>Main Title</h1><h2>Subtitle</h2>"
            "<p>This paragraph includes all marks: <strong>bold</strong>, "
            "<em>italic</em>, <u>underlined</u>, <s>strikethrough</s>, "
            "<code>inline code</code>, and "
            '<a href="https://example.com" title="Example">link</a>.</p>'
            "<blockquote><p>This is a quoted paragraph.</p></blockquote>"
            "<pre><code>function hello() {\n  console.log(&#x27;Hello, world!&#x27;)"
            ";\n}</code></pre>"
            '<p>Here&#x27;s an image: <img src="https://example.com/image.jpg" '
            'alt="Example image" title="An example image"><br>Text after line break.'
            "</p>"
            "<ul><li><p>First bullet point</p></li>"
            "<li><p>Second bullet point</p></li></ul>"
            "<ol><li><p>First numbered item</p></li>"
            "<li><p>Second numbered item</p></li></ol>"
            "<hr><p>This document contains all node and mark types.</p>"
        )

        assert html == expected_html
        assert html_to_doc(html, schema=config.schema) == full_document, (
            "Round-trip from document to html is lossless"
        )

    def test_minimal_document_produces_simple_paragraph(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[])
        schema = config.schema
        doc = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Hello world"}],
                }
            ],
        }

        html = doc_to_html(doc, schema=schema)

        assert html == "<p>Hello world</p>"

    @pytest.mark.parametrize(
        "input_doc,expected_html",
        [
            ({}, ""),
            (None, ""),
        ],
    )
    def test_empty_or_none_document_returns_empty_string(
        self, input_doc, expected_html
    ):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[])
        schema = config.schema

        html = doc_to_html(input_doc, schema=schema)

        assert html == expected_html

    @pytest.mark.parametrize(
        "level,text,expected_tag",
        [
            (1, "Main Title", "h1"),
            (2, "Subtitle", "h2"),
            (3, "Section Header", "h3"),
            (4, "Subsection", "h4"),
            (5, "Minor Header", "h5"),
            (6, "Smallest Header", "h6"),
        ],
    )
    def test_heading_levels_produce_correct_heading_tags(
        self, level, text, expected_tag
    ):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH, NodeType.HEADING], allowed_mark_types=[])
        schema = config.schema
        doc = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": level},
                    "content": [{"type": "text", "text": text}],
                }
            ],
        }

        html = doc_to_html(doc, schema=schema)

        expected_html = f"<{expected_tag}>{text}</{expected_tag}>"
        assert html == expected_html

    @pytest.mark.parametrize(
        "mark_type,text,expected_tag",
        [
            ("strong", "bold text", "strong"),
            ("em", "italic text", "em"),
            ("code", "inline code", "code"),
        ],
    )
    def test_text_marks_produce_formatted_text(self, mark_type, text, expected_tag):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH],
            allowed_mark_types=[MarkType.STRONG, MarkType.ITALIC, MarkType.CODE])
        schema = config.schema
        doc = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Plain "},
                        {"type": "text", "marks": [{"type": mark_type}], "text": text},
                        {"type": "text", "text": " text"},
                    ],
                }
            ],
        }

        html = doc_to_html(doc, schema=schema)

        expected_html = f"<p>Plain <{expected_tag}>{text}</{expected_tag}> text</p>"
        assert html == expected_html

    def test_link_produces_anchor_tag_with_href_and_title(self):
        config = ProsemirrorConfig(
            allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[MarkType.LINK])
        schema = config.schema
        doc = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Visit "},
                        {
                            "type": "text",
                            "marks": [
                                {
                                    "type": "link",
                                    "attrs": {
                                        "href": "https://example.com",
                                        "title": "Example Site",
                                    },
                                }
                            ],
                            "text": "this link",
                        },
                    ],
                }
            ],
        }

        html = doc_to_html(doc, schema=schema)

        expected_html = (
            '<p>Visit <a href="https://example.com" title="Example Site">'
            "this link</a></p>"
        )
        assert html == expected_html

    @pytest.mark.parametrize(
        "node_type,allowed_node,text,expected_html",
        [
            (
                "blockquote",
                NodeType.BLOCKQUOTE,
                "This is a quote",
                "<blockquote><p>This is a quote</p></blockquote>",
            ),
            (
                "code_block",
                NodeType.CODE_BLOCK,
                "function test() {\n  return true;\n}",
                "<pre><code>function test() {\n  return true;\n}</code></pre>",
            ),
        ],
    )
    def test_block_elements_produce_correct_tags(
        self, node_type, allowed_node, text, expected_html
    ):
        config = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH] + [allowed_node], allowed_mark_types=[])
        schema = config.schema

        if node_type == "blockquote":
            content = [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": text}],
                }
            ]
        else:  # code_block
            content = [{"type": "text", "text": text}]

        doc = {
            "type": "doc",
            "content": [
                {
                    "type": node_type,
                    "content": content,
                }
            ],
        }

        html = doc_to_html(doc, schema=schema)

        assert html == expected_html


class TestHtmlToDoc:
    """Tests for html_to_doc function."""

    def test_simple_paragraph_produces_paragraph_node(
        self,
    ):
        config = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[])
        schema = config.schema
        html = "<p>Hello world</p>"

        doc = html_to_doc(html, schema=schema)

        expected = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Hello world"}],
                }
            ],
        }
        assert doc == expected

    def test_multiple_paragraphs_produce_paragraph_nodes(
        self,
    ):
        config = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[])
        schema = config.schema
        html = "<p>First paragraph</p><p>Second paragraph</p>"

        doc = html_to_doc(html, schema=schema)

        expected_doc = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "First paragraph"}],
                },
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Second paragraph"}],
                },
            ],
        }

        assert doc == expected_doc

    @pytest.mark.parametrize(
        "html_tag,level,text",
        [
            ("h1", 1, "Main Title"),
            ("h2", 2, "Subtitle"),
            ("h3", 3, "Section Header"),
            ("h4", 4, "Subsection"),
            ("h5", 5, "Minor Header"),
            ("h6", 6, "Smallest Header"),
        ],
    )
    def test_heading_tags_produce_heading_nodes(self, html_tag, level, text):
        config = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH] + [NodeType.HEADING], allowed_mark_types=[])
        schema = config.schema
        html = f"<{html_tag}>{text}</{html_tag}>"

        doc = html_to_doc(html, schema=schema)

        expected_doc = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": level},
                    "content": [{"type": "text", "text": text}],
                }
            ],
        }

        assert doc == expected_doc

    def test_formatted_text_produces_text_marks(self):
        config = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[MarkType.STRONG, MarkType.ITALIC])
        schema = config.schema
        html = "<p>Plain <strong>bold</strong> and <em>italic</em> text</p>"

        doc = html_to_doc(html, schema=schema)

        expected_doc = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Plain "},
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

        assert doc == expected_doc

    def test_link_produces_link_mark(self):
        config = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[MarkType.LINK])
        schema = config.schema
        html = (
            '<p>Visit <a href="https://example.com" title="Example">this link</a></p>'
        )

        doc = html_to_doc(html, schema=schema)

        expected_doc = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Visit "},
                        {
                            "type": "text",
                            "marks": [
                                {
                                    "type": "link",
                                    "attrs": {
                                        "href": "https://example.com",
                                        "title": "Example",
                                    },
                                }
                            ],
                            "text": "this link",
                        },
                    ],
                }
            ],
        }

        assert doc == expected_doc

    @pytest.mark.parametrize(
        "html,node_type,allowed_node,text",
        [
            (
                "<blockquote><p>This is a quote</p></blockquote>",
                "blockquote",
                NodeType.BLOCKQUOTE,
                "This is a quote",
            ),
            (
                "<pre><code>function test() { return true; }</code></pre>",
                "code_block",
                NodeType.CODE_BLOCK,
                "function test() { return true; }",
            ),
        ],
    )
    def test_block_elements_produce_correct_nodes(
        self, html, node_type, allowed_node, text
    ):
        config = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH] + [allowed_node], allowed_mark_types=[])
        schema = config.schema

        doc = html_to_doc(html, schema=schema)

        if node_type == "blockquote":
            content = [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": text}],
                }
            ]
        else:  # code_block
            content = [{"type": "text", "text": text}]

        expected_doc = {
            "type": "doc",
            "content": [
                {
                    "type": node_type,
                    "content": content,
                }
            ],
        }

        assert doc == expected_doc

    @pytest.mark.parametrize(
        "input_html",
        [
            "",
            "   \n\t  ",
            "   ",
            "\n",
            "\t",
            "\r\n",
            "\t\r\n",
        ],
    )
    def test_empty_or_whitespace_string_produces_empty_document(self, input_html):
        config = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[])
        schema = config.schema

        doc = html_to_doc(input_html, schema=schema)

        assert doc == EMPTY_DOC

    def test_horizontal_rule_produces_hr_node(self):
        config = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH] + [NodeType.HORIZONTAL_RULE], allowed_mark_types=[])
        schema = config.schema
        html = "<p>Before</p><hr><p>After</p>"

        doc = html_to_doc(html, schema=schema)

        expected_doc = {
            "type": "doc",
            "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": "Before"}]},
                {"type": "horizontal_rule"},
                {"type": "paragraph", "content": [{"type": "text", "text": "After"}]},
            ],
        }

        assert doc == expected_doc


class TestRoundTripConversion:
    """Tests for round-trip conversion between document and HTML."""

    @pytest.mark.parametrize(
        "node_types,mark_types,original_doc",
        [
            (
                [NodeType.HEADING],
                [],
                {
                    "type": "doc",
                    "content": [
                        {
                            "type": "heading",
                            "attrs": {"level": 1},
                            "content": [{"type": "text", "text": "Main Heading"}],
                        }
                    ],
                },
            ),
            (
                [NodeType.HEADING],
                [],
                {
                    "type": "doc",
                    "content": [
                        {
                            "type": "heading",
                            "attrs": {"level": 3},
                            "content": [{"type": "text", "text": "Sub Heading"}],
                        }
                    ],
                },
            ),
            (
                [],
                [MarkType.STRONG],
                {
                    "type": "doc",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "marks": [{"type": "strong"}],
                                    "text": "Bold Text",
                                }
                            ],
                        }
                    ],
                },
            ),
            (
                [],
                [MarkType.ITALIC],
                {
                    "type": "doc",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "marks": [{"type": "em"}],
                                    "text": "Italic Text",
                                }
                            ],
                        }
                    ],
                },
            ),
            (
                [],
                [MarkType.CODE],
                {
                    "type": "doc",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "marks": [{"type": "code"}],
                                    "text": "inline code",
                                }
                            ],
                        }
                    ],
                },
            ),
            (
                [NodeType.BLOCKQUOTE],
                [],
                {
                    "type": "doc",
                    "content": [
                        {
                            "type": "blockquote",
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [
                                        {"type": "text", "text": "Quoted Text"}
                                    ],
                                }
                            ],
                        }
                    ],
                },
            ),
            (
                [NodeType.CODE_BLOCK],
                [],
                {
                    "type": "doc",
                    "content": [
                        {
                            "type": "code_block",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "function hello() {\n  return 'world';\n}",
                                }
                            ],
                        }
                    ],
                },
            ),
            (
                [],
                [MarkType.LINK],
                {
                    "type": "doc",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {"type": "text", "text": "Check out "},
                                {
                                    "type": "text",
                                    "marks": [
                                        {
                                            "type": "link",
                                            "attrs": {
                                                "href": "https://example.com",
                                                "title": None,
                                            },
                                        }
                                    ],
                                    "text": "this link",
                                },
                            ],
                        }
                    ],
                },
            ),
            (
                [],
                [MarkType.STRONG, MarkType.ITALIC],
                {
                    "type": "doc",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {"type": "text", "text": "Text with "},
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
                                {"type": "text", "text": " formatting"},
                            ],
                        }
                    ],
                },
            ),
        ],
    )
    def test_round_trip_preserves_single_node_types(
        self, node_types, mark_types, original_doc
    ):
        node_types_with_paragraph = [NodeType.PARAGRAPH] + node_types if node_types else [NodeType.PARAGRAPH]
        config = ProsemirrorConfig(allowed_node_types=node_types_with_paragraph, allowed_mark_types=mark_types)
        schema = config.schema

        html = doc_to_html(original_doc, schema=schema)
        converted_doc = html_to_doc(html, schema=schema)

        assert converted_doc == original_doc

    def test_simple_paragraph_preserves_content(self):
        config = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[])
        schema = config.schema
        original_doc = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Hello world"}],
                }
            ],
        }

        html = doc_to_html(original_doc, schema=schema)
        converted_doc = html_to_doc(html, schema=schema)

        assert converted_doc == original_doc

    def test_formatted_text_preserves_content(self):
        config = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[MarkType.STRONG, MarkType.ITALIC])
        schema = config.schema
        original_doc = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Plain "},
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
                    ],
                }
            ],
        }

        html = doc_to_html(original_doc, schema=schema)
        converted_doc = html_to_doc(html, schema=schema)

        # Round-trip should preserve the document exactly
        assert converted_doc == original_doc

    def test_complex_markup_preserves_structure(self):
        config = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH] + [NodeType.HEADING, NodeType.BLOCKQUOTE], allowed_mark_types=[MarkType.STRONG])
        schema = config.schema
        original_html = (
            "<h1>Title</h1><blockquote><p><strong>Quote</strong> text</p></blockquote>"
        )

        doc = html_to_doc(original_html, schema=schema)
        converted_html = doc_to_html(doc, schema=schema)

        # Round-trip should preserve the HTML exactly
        assert converted_html == original_html

    def test_subset_of_full_document_preserves_structure_and_content(
        self, full_document
    ):
        # Test with a subset of features to ensure round-trip works
        config = ProsemirrorConfig(allowed_node_types=[NodeType.PARAGRAPH] + [NodeType.HEADING, NodeType.BLOCKQUOTE], allowed_mark_types=[MarkType.STRONG, MarkType.ITALIC])
        schema = config.schema

        # Create a simplified version of full_document with only supported features
        simplified_doc = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "Main Title"}],
                },
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Text with "},
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
                    ],
                },
                {
                    "type": "blockquote",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": "Quote"}],
                        }
                    ],
                },
            ],
        }

        html = doc_to_html(simplified_doc, schema=schema)
        converted_doc = html_to_doc(html, schema=schema)

        assert converted_doc == simplified_doc
