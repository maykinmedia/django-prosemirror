"""Tests for serialization and deserialization functions."""

import pytest

from django_prosemirror.config import ProsemirrorConfig
from django_prosemirror.constants import EMPTY_DOC
from django_prosemirror.schema import MarkType, NodeType
from django_prosemirror.serde import doc_to_html, html_to_doc

from .serde_test_spec import SERDE_TEST_CASES


def test_full_document_fixture_contains_all_node_and_mark_types(full_document):
    # Ensure our full document fixture is in synx with all node and mark types
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


def test_full_document_produces_expected_html_output(full_document):
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


@pytest.mark.parametrize("test_case", SERDE_TEST_CASES, ids=lambda tc: tc.name)
def test_document_to_html_conversion(test_case):
    """Test document to HTML conversion for all node and mark types."""
    # Skip None documents for doc_to_html tests
    if test_case.document is None:
        pytest.skip("None document not applicable for doc_to_html")

    config = ProsemirrorConfig(
        allowed_node_types=test_case.config_node_types,
        allowed_mark_types=test_case.config_mark_types,
    )
    schema = config.schema

    html = doc_to_html(test_case.document, schema=schema)

    assert html == test_case.expected_html, (
        f"Failed for {test_case.name}: {test_case.description}"
    )


@pytest.mark.parametrize("test_case", SERDE_TEST_CASES, ids=lambda tc: tc.name)
def test_html_to_document_conversion(test_case):
    """Test HTML to document conversion for all node and mark types."""
    # Skip cases that aren't round-trip compatible or have special handling
    if not test_case.round_trip_compatible:
        pytest.skip(f"Skipping {test_case.name}: not round-trip compatible")

    config = ProsemirrorConfig(
        allowed_node_types=test_case.config_node_types,
        allowed_mark_types=test_case.config_mark_types,
    )
    schema = config.schema

    doc = html_to_doc(test_case.expected_html, schema=schema)

    assert doc == test_case.document, (
        f"Failed for {test_case.name}: {test_case.description}"
    )


@pytest.mark.parametrize("test_case", SERDE_TEST_CASES, ids=lambda tc: tc.name)
def test_round_trip_conversion(test_case):
    """Test round-trip conversion from document to HTML and back."""
    # Skip cases that aren't round-trip compatible
    if not test_case.round_trip_compatible:
        pytest.skip(f"Skipping {test_case.name}: not round-trip compatible")

    config = ProsemirrorConfig(
        allowed_node_types=test_case.config_node_types,
        allowed_mark_types=test_case.config_mark_types,
    )
    schema = config.schema

    # Test document -> HTML -> document
    html = doc_to_html(test_case.document, schema=schema)
    round_trip_doc = html_to_doc(html, schema=schema)

    assert round_trip_doc == test_case.document, (
        f"Round-trip failed for {test_case.name}: {test_case.description}"
    )

    # Also verify the HTML matches expected
    assert html == test_case.expected_html, (
        f"HTML output didn't match expected for {test_case.name}"
    )


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
def test_empty_or_whitespace_string_produces_empty_document(input_html):
    config = ProsemirrorConfig(
        allowed_node_types=[NodeType.PARAGRAPH], allowed_mark_types=[]
    )
    schema = config.schema

    doc = html_to_doc(input_html, schema=schema)

    assert doc == EMPTY_DOC
