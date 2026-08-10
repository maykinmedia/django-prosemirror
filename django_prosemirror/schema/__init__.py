"""Prosemirror schema definitions and validation functions."""

from django.core.exceptions import ValidationError

from prosemirror.model import Node, Schema

from ..sanitize import URL_MARK_ATTRS, URL_NODE_ATTRS, is_safe_url
from .base import ClassMapping, MarkDefinition, NodeDefinition
from .marks import (
    CodeMark,
    ItalicMark,
    LinkMark,
    StrikethroughMark,
    StrongMark,
    UnderlineMark,
)
from .nodes import (
    BlockquoteNode,
    BulletListNode,
    CodeBlockNode,
    FilerImageNode,
    HardBreakNode,
    HeadingNode,
    HorizontalRuleNode,
    ListItemNode,
    OrderedListNode,
    ParagraphNode,
    TableCellNode,
    TableHeaderNode,
    TableNode,
    TableRowNode,
)
from .types import MarkType, NodeType, ProsemirrorDocument, ProsemirrorDocumentDict


def validate_doc(doc: ProsemirrorDocument, *, schema: Schema):
    """Validate that a value is a valid Prosemirror document according to the schema.

    Args:
        doc: The document to validate (should be a dict)
        schema: The Prosemirror schema to validate against

    Raises:
        ValidationError: If the document is invalid
    """
    # Do some quick sanity checks
    if not isinstance(doc, dict):
        raise ValidationError("Prosemirror document must be a dict") from None

    if not doc:
        raise ValidationError("Prosemirror document cannot be empty") from None

    if "type" not in doc:
        raise ValidationError("Prosemirror document must have a 'type' field") from None

    # Let prosemirror handle schema-specific validation
    try:
        node = Node.from_json(schema, doc)
    except (ValueError, KeyError) as exc:
        raise ValidationError(f"Invalid prosemirror document: {exc}") from exc

    _validate_urls(node)


MAX_ERROR_TEXT_LENGTH = 50
"""Longest snippet of document text quoted back in a validation error."""


def _quote_text(text: str) -> str:
    """Describe where in the document an error occurred, for the editor.

    Returns an empty string when there is no text to point at, so the caller
    can append it unconditionally.
    """
    text = text.strip()
    if not text:
        return ""

    if len(text) > MAX_ERROR_TEXT_LENGTH:
        text = text[:MAX_ERROR_TEXT_LENGTH].rstrip() + "…"

    return f' on "{text}"'


def _validate_urls(root: Node):
    """Reject documents containing URLs a browser would treat as executable.

    Prosemirror validates the shape of attributes but never their values, so a
    ``javascript:`` href survives ``Node.from_json`` and reaches rendered HTML.

    Args:
        root: The parsed document node.

    Raises:
        ValidationError: If any node or mark carries an unsafe URL.
    """
    errors: list[str] = []

    def unsafe_attrs(
        name: str,
        attrs: dict,
        url_attrs: dict[str, tuple[str, ...]],
        location: str = "",
    ):
        return (
            f"Unsafe URL scheme in '{name}.{attr}'{location}"
            for attr in url_attrs.get(name, ())
            if not is_safe_url(attrs.get(attr))
        )

    def check(node: Node, *_args) -> bool:
        errors.extend(unsafe_attrs(node.type.name, node.attrs, URL_NODE_ATTRS))

        # Marks live on the text node they cover, so its text names the link
        # an editor has to go and fix.
        location = _quote_text(node.text_content)
        for mark in node.marks:
            errors.extend(
                unsafe_attrs(mark.type.name, mark.attrs, URL_MARK_ATTRS, location)
            )

        return True

    root.descendants(check)

    if errors:
        # The document's own text is quoted to locate the problem, but never
        # the rejected URL itself.
        raise ValidationError(errors)


# Export everything needed by the rest of the application
__all__ = [
    # Types and enums
    "NodeType",
    "MarkType",
    "ProsemirrorDocument",
    "ProsemirrorDocumentDict",
    # Base classes
    "ClassMapping",
    "NodeDefinition",
    "MarkDefinition",
    # Node types
    "ParagraphNode",
    "BlockquoteNode",
    "HeadingNode",
    "HorizontalRuleNode",
    "CodeBlockNode",
    "FilerImageNode",
    "HardBreakNode",
    "BulletListNode",
    "OrderedListNode",
    "ListItemNode",
    "TableNode",
    "TableRowNode",
    "TableCellNode",
    "TableHeaderNode",
    # Mark types
    "StrongMark",
    "ItalicMark",
    "CodeMark",
    "LinkMark",
    "UnderlineMark",
    "StrikethroughMark",
    # Functions
    "validate_doc",
]
