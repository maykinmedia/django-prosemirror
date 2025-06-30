"""Prosemirror schema definitions and validation functions."""

from collections.abc import Iterable, Mapping

from django.core.exceptions import ValidationError

from prosemirror.model import Node, Schema

from django_prosemirror.constants import DEFAULT_SETTINGS
from django_prosemirror.exceptions import DjangoProsemirrorException

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
    CodeBlockNode,
    HardBreakNode,
    HeadingNode,
    HorizontalRuleNode,
    ImageNode,
    ListItemNode,
    OrderedListNode,
    ParagraphNode,
    UnorderedListNode,
)
from .types import AllowedNodeType, MarkType, NodeType, ProsemirrorDocument

SchemaSpec = Iterable[AllowedNodeType]
"""A specification for the allowed node types in a given Prosemirror field."""


class SchemaFactory:
    """Factory for creating schema instances with class mapping."""

    @staticmethod
    def create_nodes(class_mapping: ClassMapping) -> dict[NodeType, NodeDefinition]:
        """Create all available node instances with class mapping."""
        return {
            NodeType.PARAGRAPH: ParagraphNode(class_mapping),
            NodeType.BLOCKQUOTE: BlockquoteNode(class_mapping),
            NodeType.HEADING: HeadingNode(class_mapping),
            NodeType.HORIZONTAL_RULE: HorizontalRuleNode(class_mapping),
            NodeType.CODE_BLOCK: CodeBlockNode(class_mapping),
            NodeType.IMAGE: ImageNode(class_mapping),
            NodeType.HARD_BREAK: HardBreakNode(class_mapping),
            NodeType.UNORDERED_LIST: UnorderedListNode(class_mapping),
            NodeType.ORDERED_LIST: OrderedListNode(class_mapping),
            NodeType.LIST_ITEM: ListItemNode(class_mapping),
        }

    @staticmethod
    def create_marks(class_mapping: ClassMapping) -> dict[MarkType, MarkDefinition]:
        """Create all available mark instances with class mapping."""
        return {
            MarkType.STRONG: StrongMark(class_mapping),
            MarkType.ITALIC: ItalicMark(class_mapping),
            MarkType.CODE: CodeMark(class_mapping),
            MarkType.LINK: LinkMark(class_mapping),
            MarkType.UNDERLINE: UnderlineMark(class_mapping),
            MarkType.STRIKETHROUGH: StrikethroughMark(class_mapping),
        }


def construct_schema_from_spec(
    spec: SchemaSpec, classes: Mapping[str, str] = DEFAULT_SETTINGS["classes"]
) -> Schema:
    """Construct a Prosemirror Schema from a specification of allowed node types."""
    msg = f"`spec` must be a collection of {AllowedNodeType.__name__} elements"
    try:
        if not all(isinstance(item, AllowedNodeType) for item in spec):
            raise DjangoProsemirrorException(msg)
    except TypeError:  # Non-iterable types
        raise DjangoProsemirrorException(msg) from None

    class_mapping = ClassMapping(dict(classes))

    # Create instances with class mapping
    available_nodes = SchemaFactory.create_nodes(class_mapping)
    available_marks = SchemaFactory.create_marks(class_mapping)

    # Core node types that must always be present
    schema_nodes = {
        "doc": {"content": "block+"},
        "paragraph": ParagraphNode(class_mapping).spec,
        "text": {"group": "inline"},
    }

    schema_marks = {}

    for item in spec:
        # Convert AllowedNodeType to NodeType/MarkType for lookup
        if hasattr(NodeType, item.name):
            node_type = NodeType(item.value)
            if node_type in available_nodes:
                schema_nodes[item.value] = available_nodes[node_type].spec
        elif hasattr(MarkType, item.name):
            mark_type = MarkType(item.value)
            if mark_type in available_marks:
                schema_marks[item.value] = available_marks[mark_type].spec

    return Schema({"nodes": schema_nodes, "marks": schema_marks})


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


# Create FULL schema spec for backward compatibility
FULL = tuple(AllowedNodeType)

# Export everything needed by the rest of the application
__all__ = [
    "AllowedNodeType",
    "NodeType",
    "MarkType",
    "ProsemirrorDocument",
    "SchemaSpec",
    "ClassMapping",
    "construct_schema_from_spec",
    "validate_doc",
    "FULL",
]
