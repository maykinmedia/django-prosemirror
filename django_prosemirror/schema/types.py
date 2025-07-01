"""Type definitions for the schema module."""

import enum
from typing import TypeAlias

from prosemirror.utils import JSONDict

ProsemirrorDocument: TypeAlias = JSONDict


class NodeType(enum.Enum):
    """Enumeration of node types that can be used in Prosemirror schemas."""

    # Core nodes (always present)
    PARAGRAPH = "paragraph"

    # Optional nodes
    BLOCKQUOTE = "blockquote"
    HORIZONTAL_RULE = "horizontal_rule"
    HEADING = "heading"
    IMAGE = "image"
    HARD_BREAK = "hard_break"
    CODE_BLOCK = "code_block"
    UNORDERED_LIST = "unordered_list"
    ORDERED_LIST = "ordered_list"
    LIST_ITEM = "list_item"


class MarkType(enum.Enum):
    """Enumeration of mark types that can be used in Prosemirror schemas."""

    STRONG = "strong"
    ITALIC = "em"
    LINK = "link"
    CODE = "code"
    UNDERLINE = "underline"
    STRIKETHROUGH = "strikethrough"
