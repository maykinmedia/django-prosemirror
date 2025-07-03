"""Test specifications for ProseMirror serialization/deserialization tests."""

from dataclasses import dataclass
from typing import Any

from django_prosemirror.constants import EMPTY_DOC
from django_prosemirror.schema import MarkType, NodeType


@dataclass(frozen=True)
class SerdeTestCase:
    """A single test case for serialization/deserialization testing."""

    name: str
    description: str
    config_node_types: list[NodeType]
    config_mark_types: list[MarkType]
    document: dict[str, Any] | None
    expected_html: str
    round_trip_compatible: bool = True


# Test cases for basic document structures
BASIC_DOCUMENT_CASES = [
    SerdeTestCase(
        name="empty_document",
        description="Empty document produces empty string",
        config_node_types=[NodeType.PARAGRAPH],
        config_mark_types=[],
        document={},
        expected_html="",
        round_trip_compatible=False,  # Empty doc doesn't round-trip to empty dict
    ),
    SerdeTestCase(
        name="none_document",
        description="None document produces empty string",
        config_node_types=[NodeType.PARAGRAPH],
        config_mark_types=[],
        document=None,
        expected_html="",
        round_trip_compatible=False,  # None doesn't round-trip
    ),
    SerdeTestCase(
        name="minimal_paragraph",
        description="Simple paragraph with text",
        config_node_types=[NodeType.PARAGRAPH],
        config_mark_types=[],
        document={
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Hello world"}],
                }
            ],
        },
        expected_html="<p>Hello world</p>",
    ),
]

# Test cases for heading nodes
HEADING_CASES = [
    SerdeTestCase(
        name=f"heading_level_{level}",
        description=f"Heading level {level} produces {tag} tag",
        config_node_types=[NodeType.PARAGRAPH, NodeType.HEADING],
        config_mark_types=[],
        document={
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": level},
                    "content": [{"type": "text", "text": text}],
                }
            ],
        },
        expected_html=f"<{tag}>{text}</{tag}>",
    )
    for level, text, tag in [
        (1, "Main Title", "h1"),
        (2, "Subtitle", "h2"),
        (3, "Section Header", "h3"),
        (4, "Subsection", "h4"),
        (5, "Minor Header", "h5"),
        (6, "Smallest Header", "h6"),
    ]
]

# Test cases for text marks
MARK_CASES = [
    SerdeTestCase(
        name="strong_mark",
        description="Strong mark produces bold text",
        config_node_types=[NodeType.PARAGRAPH],
        config_mark_types=[MarkType.STRONG],
        document={
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Plain "},
                        {
                            "type": "text",
                            "marks": [{"type": "strong"}],
                            "text": "bold text",
                        },
                        {"type": "text", "text": " text"},
                    ],
                }
            ],
        },
        expected_html="<p>Plain <strong>bold text</strong> text</p>",
    ),
    SerdeTestCase(
        name="italic_mark",
        description="Italic mark produces emphasized text",
        config_node_types=[NodeType.PARAGRAPH],
        config_mark_types=[MarkType.ITALIC],
        document={
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Plain "},
                        {
                            "type": "text",
                            "marks": [{"type": "em"}],
                            "text": "italic text",
                        },
                        {"type": "text", "text": " text"},
                    ],
                }
            ],
        },
        expected_html="<p>Plain <em>italic text</em> text</p>",
    ),
    SerdeTestCase(
        name="code_mark",
        description="Code mark produces inline code",
        config_node_types=[NodeType.PARAGRAPH],
        config_mark_types=[MarkType.CODE],
        document={
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Plain "},
                        {
                            "type": "text",
                            "marks": [{"type": "code"}],
                            "text": "inline code",
                        },
                        {"type": "text", "text": " text"},
                    ],
                }
            ],
        },
        expected_html="<p>Plain <code>inline code</code> text</p>",
    ),
    SerdeTestCase(
        name="underline_mark",
        description="Underline mark produces underlined text",
        config_node_types=[NodeType.PARAGRAPH],
        config_mark_types=[MarkType.UNDERLINE],
        document={
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Plain "},
                        {
                            "type": "text",
                            "marks": [{"type": "underline"}],
                            "text": "underlined",
                        },
                        {"type": "text", "text": " text"},
                    ],
                }
            ],
        },
        expected_html="<p>Plain <u>underlined</u> text</p>",
    ),
    SerdeTestCase(
        name="strikethrough_mark",
        description="Strikethrough mark produces strikethrough text",
        config_node_types=[NodeType.PARAGRAPH],
        config_mark_types=[MarkType.STRIKETHROUGH],
        document={
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Plain "},
                        {
                            "type": "text",
                            "marks": [{"type": "strikethrough"}],
                            "text": "struck",
                        },
                        {"type": "text", "text": " text"},
                    ],
                }
            ],
        },
        expected_html="<p>Plain <s>struck</s> text</p>",
    ),
    SerdeTestCase(
        name="link_mark",
        description="Link mark produces anchor tag with href and title",
        config_node_types=[NodeType.PARAGRAPH],
        config_mark_types=[MarkType.LINK],
        document={
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
        },
        expected_html=(
            '<p>Visit <a href="https://example.com" title="Example Site">this link</a>'
            "</p>"
        ),
    ),
    SerdeTestCase(
        name="multiple_marks",
        description="Multiple marks on different text segments",
        config_node_types=[NodeType.PARAGRAPH],
        config_mark_types=[MarkType.STRONG, MarkType.ITALIC],
        document={
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
        expected_html=(
            "<p>Text with <strong>bold</strong> and <em>italic</em> formatting</p>"
        ),
    ),
]

# Test cases for block elements
BLOCK_ELEMENT_CASES = [
    SerdeTestCase(
        name="blockquote",
        description="Blockquote node produces blockquote tag",
        config_node_types=[NodeType.PARAGRAPH, NodeType.BLOCKQUOTE],
        config_mark_types=[],
        document={
            "type": "doc",
            "content": [
                {
                    "type": "blockquote",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": "This is a quote"}],
                        }
                    ],
                }
            ],
        },
        expected_html="<blockquote><p>This is a quote</p></blockquote>",
    ),
    SerdeTestCase(
        name="code_block",
        description="Code block node produces pre/code tags",
        config_node_types=[NodeType.PARAGRAPH, NodeType.CODE_BLOCK],
        config_mark_types=[],
        document={
            "type": "doc",
            "content": [
                {
                    "type": "code_block",
                    "content": [
                        {
                            "type": "text",
                            "text": "function test() {\n  return true;\n}",
                        }
                    ],
                }
            ],
        },
        expected_html="<pre><code>function test() {\n  return true;\n}</code></pre>",
    ),
    SerdeTestCase(
        name="horizontal_rule",
        description="Horizontal rule produces hr tag",
        config_node_types=[NodeType.PARAGRAPH, NodeType.HORIZONTAL_RULE],
        config_mark_types=[],
        document={
            "type": "doc",
            "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": "Before"}]},
                {"type": "horizontal_rule"},
                {"type": "paragraph", "content": [{"type": "text", "text": "After"}]},
            ],
        },
        expected_html="<p>Before</p><hr><p>After</p>",
    ),
]

# Test cases for list elements
LIST_CASES = [
    SerdeTestCase(
        name="unordered_list",
        description="Unordered list produces ul with li elements",
        config_node_types=[
            NodeType.PARAGRAPH,
            NodeType.UNORDERED_LIST,
            NodeType.LIST_ITEM,
        ],
        config_mark_types=[],
        document={
            "type": "doc",
            "content": [
                {
                    "type": "unordered_list",
                    "content": [
                        {
                            "type": "list_item",
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [
                                        {"type": "text", "text": "First bullet point"}
                                    ],
                                }
                            ],
                        },
                        {
                            "type": "list_item",
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [
                                        {"type": "text", "text": "Second bullet point"}
                                    ],
                                }
                            ],
                        },
                    ],
                }
            ],
        },
        expected_html=(
            "<ul><li><p>First bullet point</p></li><li><p>Second bullet point</p></li>"
            "</ul>"
        ),
    ),
    SerdeTestCase(
        name="ordered_list",
        description="Ordered list produces ol with li elements",
        config_node_types=[
            NodeType.PARAGRAPH,
            NodeType.ORDERED_LIST,
            NodeType.LIST_ITEM,
        ],
        config_mark_types=[],
        document={
            "type": "doc",
            "content": [
                {
                    "type": "ordered_list",
                    "content": [
                        {
                            "type": "list_item",
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [
                                        {"type": "text", "text": "First numbered item"}
                                    ],
                                }
                            ],
                        },
                        {
                            "type": "list_item",
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [
                                        {"type": "text", "text": "Second numbered item"}
                                    ],
                                }
                            ],
                        },
                    ],
                }
            ],
        },
        expected_html=(
            "<ol><li><p>First numbered item</p></li><li><p>Second numbered item</p>"
            "</li></ol>"
        ),
    ),
]

# Test cases for inline elements
INLINE_ELEMENT_CASES = [
    SerdeTestCase(
        name="image",
        description="Image node produces img tag with attributes",
        config_node_types=[NodeType.PARAGRAPH, NodeType.IMAGE],
        config_mark_types=[],
        document={
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Here's an image: "},
                        {
                            "type": "image",
                            "attrs": {
                                "src": "https://example.com/image.jpg",
                                "alt": "Example image",
                                "title": "An example image",
                            },
                        },
                    ],
                }
            ],
        },
        expected_html=(
            '<p>Here&#x27;s an image: <img src="https://example.com/image.jpg" alt='
            '"Example image" title="An example image"></p>'
        ),
    ),
    SerdeTestCase(
        name="hard_break",
        description="Hard break node produces br tag",
        config_node_types=[NodeType.PARAGRAPH, NodeType.HARD_BREAK],
        config_mark_types=[],
        document={
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Line one"},
                        {"type": "hard_break"},
                        {"type": "text", "text": "Line two"},
                    ],
                }
            ],
        },
        expected_html="<p>Line one<br>Line two</p>",
    ),
]

# Special edge cases
EDGE_CASES = [
    SerdeTestCase(
        name="multiple_paragraphs",
        description="Multiple paragraphs produce multiple p tags",
        config_node_types=[NodeType.PARAGRAPH],
        config_mark_types=[],
        document={
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
        },
        expected_html="<p>First paragraph</p><p>Second paragraph</p>",
    ),
]

# Combined test cases
ALL_SERDE_TEST_CASES = (
    BASIC_DOCUMENT_CASES
    + HEADING_CASES
    + MARK_CASES
    + BLOCK_ELEMENT_CASES
    + LIST_CASES
    + INLINE_ELEMENT_CASES
    + EDGE_CASES
)

# Test cases specifically for HTML-to-document conversion edge cases
HTML_TO_DOC_EDGE_CASES = [
    SerdeTestCase(
        name="empty_html",
        description="Empty HTML string produces empty document",
        config_node_types=[NodeType.PARAGRAPH],
        config_mark_types=[],
        document=EMPTY_DOC,
        expected_html="",
        round_trip_compatible=False,  # Empty HTML doesn't round-trip to empty string
    ),
    SerdeTestCase(
        name="whitespace_html",
        description="Whitespace-only HTML produces empty document",
        config_node_types=[NodeType.PARAGRAPH],
        config_mark_types=[],
        document=EMPTY_DOC,
        expected_html="   \n\t  ",
        round_trip_compatible=False,  # Whitespace doesn't round-trip
    ),
]

# Export the main test cases list
SERDE_TEST_CASES = ALL_SERDE_TEST_CASES
