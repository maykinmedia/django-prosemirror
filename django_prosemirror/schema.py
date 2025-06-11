"""Prosemirror schema definitions and validation functions."""

import enum
from collections.abc import Iterable
from typing import TypeAlias


class AllowedNodeType(enum.Enum):
    """Enumeration of node types that can be used in Prosemirror schemas.

    Each enum value corresponds to a supported Prosemirror node or mark type
    that can be included in a schema specification.
    """

    STRONG = "strong"
    ITALIC = "em"
    BLOCKQUOTE = "blockquote"
    HORIZONTAL_RULE = "horizontal_rule"
    HEADING = "heading"
    IMAGE = "image"
    LINK = "link"
    HARD_BREAK = "hard_break"
    CODE = "code"
    CODE_BLOCK = "code_block"


SchemaSpec: TypeAlias = Iterable[AllowedNodeType]
