"""Prosemirror schema definitions and validation functions."""

from django.core.exceptions import ValidationError

from prosemirror.model import Node, Schema

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
from .types import MarkType, NodeType, ProsemirrorDocument


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
        Node.from_json(schema, doc)
    except (ValueError, KeyError) as exc:
        raise ValidationError(f"Invalid prosemirror document: {exc}") from exc


# Export everything needed by the rest of the application
__all__ = [
    # Types and enums
    "NodeType",
    "MarkType",
    "ProsemirrorDocument",
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
