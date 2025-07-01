"""Prosemirror schema definitions and validation functions."""

from collections.abc import Iterable, Mapping
from typing import cast

from django.core.exceptions import ValidationError

from prosemirror.model import Node, Schema

from django_prosemirror.constants import DEFAULT_SETTINGS

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
from .types import MarkType, NodeType, ProsemirrorDocument


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

    @staticmethod
    def create_schema(
        allowed_node_types: Iterable[NodeType] | None = None,
        allowed_mark_types: Iterable[MarkType] | None = None,
        tag_to_classes: Mapping[str, str] | None = None,
    ) -> Schema:
        """Create a Prosemirror Schema from allowed node and mark types.

        Args:
            allowed_node_types: Iterable of NodeType enums to include (defaults to all)
            allowed_mark_types: Iterable of MarkType enums to include (defaults to all)
            tag_to_classes: Mapping of tag names to CSS classes

        Raises:
            TypeError: If node types or mark types are not valid enums
        """
        # Default to all types if not specified
        if allowed_node_types is None:
            allowed_node_types = list(NodeType)
        if allowed_mark_types is None:
            allowed_mark_types = list(MarkType)

        # Validate node types
        if allowed_node_types is not None:
            try:
                allowed_node_types = list(allowed_node_types)
                for node_type in allowed_node_types:
                    if not isinstance(node_type, NodeType):
                        raise TypeError(
                            f"Expected NodeType enum, got "
                            f"{type(node_type)}: {node_type}"
                        )
            except TypeError:
                raise
            except Exception:
                raise TypeError(
                    "allowed_node_types must be an iterable of NodeType enums"
                ) from None

        # Validate mark types
        if allowed_mark_types is not None:
            try:
                allowed_mark_types = list(allowed_mark_types)
                for mark_type in allowed_mark_types:
                    if not isinstance(mark_type, MarkType):
                        raise TypeError(
                            f"Expected MarkType enum, got "
                            f"{type(mark_type)}: {mark_type}"
                        )
            except TypeError:
                raise
            except Exception:
                raise TypeError(
                    "allowed_mark_types must be an iterable of MarkType enums"
                ) from None

        if tag_to_classes is None:
            tag_to_classes = DEFAULT_SETTINGS["tag_to_classes"]

        class_mapping = ClassMapping(cast(dict, tag_to_classes))

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

        # Add requested node types
        for node_type in allowed_node_types:
            if node_type in available_nodes:
                schema_nodes[node_type.value] = available_nodes[node_type].spec

        # Add requested mark types
        for mark_type in allowed_mark_types:
            if mark_type in available_marks:
                schema_marks[mark_type.value] = available_marks[mark_type].spec

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


# Export everything needed by the rest of the application
__all__ = [
    "NodeType",
    "MarkType",
    "ProsemirrorDocument",
    "ClassMapping",
    "SchemaFactory",
    "validate_doc",
]
