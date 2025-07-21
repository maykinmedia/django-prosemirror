"""Configuration classes for ProseMirror components."""

from collections.abc import Mapping
from typing import cast

from prosemirror import Schema

from django_prosemirror.constants import DEFAULT_SETTINGS, SETTINGS_KEY
from django_prosemirror.schema import MarkDefinition, NodeDefinition
from django_prosemirror.schema.base import ClassMapping
from django_prosemirror.schema.marks import (
    CodeMark,
    ItalicMark,
    LinkMark,
    StrikethroughMark,
    StrongMark,
    UnderlineMark,
)
from django_prosemirror.schema.nodes import (
    BlockquoteNode,
    BulletListNode,
    CodeBlockNode,
    HardBreakNode,
    HeadingNode,
    HorizontalRuleNode,
    ImageNode,
    ListItemNode,
    OrderedListNode,
    ParagraphNode,
    TableCellNode,
    TableHeaderNode,
    TableNode,
    TableRowNode,
)
from django_prosemirror.schema.types import MarkType, NodeType


def get_setting(key: str):
    from django.conf import settings

    return getattr(settings, SETTINGS_KEY, DEFAULT_SETTINGS)[key]


class ProsemirrorConfig:
    """Configuration for ProseMirror fields and widgets."""

    allowed_node_types: list[NodeType]
    allowed_mark_types: list[MarkType]
    tag_to_classes: Mapping[str, str]
    history: bool = True

    def __init__(
        self,
        *,
        allowed_node_types: list[NodeType] | None = None,
        allowed_mark_types: list[MarkType] | None = None,
        tag_to_classes: Mapping[str, str] | None = None,
        history: bool | None = None,
    ):
        if allowed_node_types is None:
            default_node_strings = get_setting("allowed_node_types")
            self.allowed_node_types = [
                NodeType(node_str) for node_str in default_node_strings
            ]
        else:
            if NodeType.PARAGRAPH not in allowed_node_types:
                raise ValueError(
                    f"Your list of allowed node types must include {NodeType.PARAGRAPH}"
                )
            self.allowed_node_types = allowed_node_types

        if allowed_mark_types is None:
            # Convert string values from DEFAULT_SETTINGS to MarkType enums
            default_mark_strings = get_setting("allowed_mark_types")
            self.allowed_mark_types = [
                MarkType(mark_str) for mark_str in default_mark_strings
            ]
        else:
            self.allowed_mark_types = allowed_mark_types

        self.history = get_setting("history") if history is None else history
        default_tag_to_classes = get_setting("tag_to_classes")
        self.tag_to_classes = default_tag_to_classes | (tag_to_classes or {})

        # Validate node types
        try:
            for node_type in self.allowed_node_types:
                if not isinstance(node_type, NodeType):
                    raise TypeError(
                        f"Expected NodeType enum, got {type(node_type)}: {node_type}"
                    )
        except TypeError:
            raise
        except Exception:
            raise TypeError(
                "allowed_node_types must be an iterable of NodeType enums"
            ) from None

        # Validate mark types
        try:
            for mark_type in self.allowed_mark_types:
                if not isinstance(mark_type, MarkType):
                    raise TypeError(
                        f"Expected MarkType enum, got {type(mark_type)}: {mark_type}"
                    )
        except TypeError:
            raise
        except Exception:
            raise TypeError(
                "allowed_mark_types must be an iterable of MarkType enums"
            ) from None

    @staticmethod
    def _create_nodes(class_mapping) -> dict[NodeType, NodeDefinition]:
        """Create all available node instances with class mapping."""
        return {
            NodeType.PARAGRAPH: ParagraphNode(class_mapping),
            NodeType.BLOCKQUOTE: BlockquoteNode(class_mapping),
            NodeType.HEADING: HeadingNode(class_mapping),
            NodeType.HORIZONTAL_RULE: HorizontalRuleNode(class_mapping),
            NodeType.CODE_BLOCK: CodeBlockNode(class_mapping),
            NodeType.IMAGE: ImageNode(class_mapping),
            NodeType.HARD_BREAK: HardBreakNode(class_mapping),
            NodeType.BULLET_LIST: BulletListNode(class_mapping),
            NodeType.ORDERED_LIST: OrderedListNode(class_mapping),
            NodeType.LIST_ITEM: ListItemNode(class_mapping),
            NodeType.TABLE: TableNode(class_mapping),
            NodeType.TABLE_ROW: TableRowNode(class_mapping),
            NodeType.TABLE_CELL: TableCellNode(class_mapping),
            NodeType.TABLE_HEADER: TableHeaderNode(class_mapping),
        }

    @staticmethod
    def _create_marks(class_mapping) -> dict[MarkType, MarkDefinition]:
        """Create all available mark instances with class mapping."""
        return {
            MarkType.STRONG: StrongMark(class_mapping),
            MarkType.ITALIC: ItalicMark(class_mapping),
            MarkType.CODE: CodeMark(class_mapping),
            MarkType.LINK: LinkMark(class_mapping),
            MarkType.UNDERLINE: UnderlineMark(class_mapping),
            MarkType.STRIKETHROUGH: StrikethroughMark(class_mapping),
        }

    @property
    def schema(self) -> Schema:
        """Generate a ProseMirror schema from this configuration."""
        # Resolve tag_to_classes with defaults
        class_mapping = ClassMapping(cast(dict, self.tag_to_classes))

        # Create instances with class mapping
        available_nodes = self._create_nodes(class_mapping)
        available_marks = self._create_marks(class_mapping)

        # Core node types that must always be present
        schema_nodes = {
            "doc": {"content": "block+"},
            "paragraph": ParagraphNode(class_mapping).spec,
            "text": {"group": "inline"},
        }

        schema_marks = {}

        for node_type in self.allowed_node_types:
            if node_type in available_nodes:
                schema_nodes[node_type.value] = available_nodes[node_type].spec

        for mark_type in self.allowed_mark_types:
            if mark_type in available_marks:
                schema_marks[mark_type.value] = available_marks[mark_type].spec

        return Schema({"nodes": schema_nodes, "marks": schema_marks})

    @property
    def all_schema_types(self) -> list[str]:
        """Return a JSON string of all node and mark type values."""
        schema_types = []
        if self.allowed_node_types:
            schema_types.extend(
                node_type.value for node_type in self.allowed_node_types
            )
        if self.allowed_mark_types:
            schema_types.extend(
                mark_type.value for mark_type in self.allowed_mark_types
            )
        return schema_types
