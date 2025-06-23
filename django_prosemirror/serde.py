"""Serialization and deserialization functions for Prosemirror documents."""

from prosemirror import Schema
from prosemirror.model import DOMSerializer, Node
from prosemirror.model.from_dom import from_html

from django_prosemirror.constants import EMPTY_DOC
from django_prosemirror.schema import ProsemirrorDocument


def doc_to_html(value: ProsemirrorDocument, *, schema: Schema) -> str:
    """Convert a Prosemirror document to HTML.

    Args:
        value: object containing the Prosemirror document
        schema: Prosemirror schema defining document structure

    Returns:
        str: HTML representation of the document
    """
    if not value:
        return ""

    content = Node.from_json(schema, value)
    serializer = DOMSerializer.from_schema(schema)
    return str(serializer.serialize_fragment(content))


def html_to_doc(value: str, *, schema: Schema) -> ProsemirrorDocument:
    """Convert HTML to a Prosemirror document.

    Args:
        value: HTML string to convert
        schema: Prosemirror schema defining document structure

    Returns:
        ProsemirrorDocument: Document as dict/JSON structure
    """
    if not value.strip():
        # Return empty document for empty/whitespace-only strings
        return EMPTY_DOC

    return from_html(schema, value)
