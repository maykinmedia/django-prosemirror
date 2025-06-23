"""Prosemirror schema definitions and validation functions."""

import enum
from collections.abc import Iterable
from typing import TypeAlias

from django.core.exceptions import ValidationError

from prosemirror.model import Node, Schema
from prosemirror.model.schema import MarkSpec, NodeSpec
from prosemirror.utils import JSONDict

from django_prosemirror.exceptions import DjangoProsemirrorException

ProsemirrorDocument: TypeAlias = JSONDict


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
"""A specification for the allowed node types in a given Prosemirror field."""


# Most of the schema validation logic was lifted from the prosemirror-py library
p_dom = ["p", 0]
blockquote_dom = ["blockquote", 0]
hr_dom = ["hr"]
pre_dom = ["pre", ["code", 0]]
br_dom = ["br"]

nodes: dict[str, NodeSpec] = {
    "doc": {"content": "block+"},
    "paragraph": {
        "content": "inline*",
        "group": "block",
        "parseDOM": [{"tag": "p"}],
        "toDOM": lambda _: p_dom,
    },
    "blockquote": {
        "content": "block+",
        "group": "block",
        "defining": True,
        "parseDOM": [{"tag": "blockquote"}],
        "toDOM": lambda _: blockquote_dom,
    },
    "horizontal_rule": {
        "group": "block",
        "parseDOM": [{"tag": "hr"}],
        "toDOM": lambda _: hr_dom,
    },
    "heading": {
        "attrs": {"level": {"default": 1}},
        "content": "inline*",
        "group": "block",
        "defining": True,
        "parseDOM": [
            {"tag": "h1", "attrs": {"level": 1}},
            {"tag": "h2", "attrs": {"level": 2}},
            {"tag": "h3", "attrs": {"level": 3}},
            {"tag": "h4", "attrs": {"level": 4}},
            {"tag": "h5", "attrs": {"level": 5}},
            {"tag": "h6", "attrs": {"level": 6}},
        ],
        "toDOM": lambda node: [f"h{node.attrs['level']}", 0],
    },
    "code_block": {
        "content": "text*",
        "marks": "",
        "group": "block",
        "code": True,
        "defining": True,
        "parseDOM": [{"tag": "pre", "preserveWhitespace": "full"}],
        "toDOM": lambda _: pre_dom,
    },
    "text": {"group": "inline"},
    "image": {
        "inline": True,
        "attrs": {"src": {}, "alt": {"default": None}, "title": {"default": None}},
        "group": "inline",
        "draggable": True,
        "parseDOM": [
            {
                "tag": "img",
                "getAttrs": lambda dom_: {
                    "src": dom_.get("src"),
                    "title": dom_.get("title"),
                },
            },
        ],
        "toDOM": lambda node: [
            "img",
            {
                "src": node.attrs["src"],
                "alt": node.attrs["alt"],
                "title": node.attrs["title"],
            },
        ],
    },
    "hard_break": {
        "inline": True,
        "group": "inline",
        "selectable": False,
        "parseDOM": [{"tag": "br"}],
        "toDOM": lambda _: br_dom,
    },
}


em_dom = ["em", 0]
strong_dom = ["strong", 0]
code_dom = ["code", 0]

marks: dict[str, MarkSpec] = {
    "link": {
        "attrs": {"href": {}, "title": {"default": None}},
        "inclusive": False,
        "parseDOM": [{"tag": "a", "getAttrs": lambda d: {"href": d.get("href")}}],
        "toDOM": lambda node, _: [
            "a",
            {"href": node.attrs["href"], "title": node.attrs["title"]},
            0,
        ],
    },
    "em": {
        "parseDOM": [{"tag": "i"}, {"tag": "em"}, {"style": "font-style=italic"}],
        "toDOM": lambda _, __: em_dom,
    },
    "strong": {
        "parseDOM": [{"tag": "strong"}, {"tag": "b"}, {"style": "font-weight"}],
        "toDOM": lambda _, __: strong_dom,
    },
    "code": {"parseDOM": [{"tag": "code"}], "toDOM": lambda _, __: code_dom},
}


def construct_schema_from_spec(spec: SchemaSpec):
    """Construct a Prosemirror Schema from a specification of allowed node types."""
    msg = f"`spec` must be a collection of {AllowedNodeType.__name__} elements"
    try:
        if not all(isinstance(item, AllowedNodeType) for item in spec):
            raise DjangoProsemirrorException(msg)
    except TypeError:  # Non-iterable types
        raise DjangoProsemirrorException(msg) from None

    schema_marks: dict[str, MarkSpec] = {}

    # Core node types that must always be present
    schema_nodes: dict[str, NodeSpec] = {
        "doc": {"content": "block+"},
        "paragraph": {
            "content": "inline*",
            "group": "block",
            "parseDOM": [{"tag": "p"}],
            "toDOM": lambda _: p_dom,
        },
        "text": {"group": "inline"},
    }
    for item in spec:
        node = nodes.get(item.value, None)
        mark = marks.get(item.value, None)

        if not node and not mark:
            raise DjangoProsemirrorException(
                f"Item {item} in your schema spec is not currently implemented"
            ) from None

        if node:
            schema_nodes[item.value] = node

        if mark:
            schema_marks[item.value] = mark

    return Schema({"nodes": schema_nodes, "marks": schema_marks})


FULL = tuple(allowed_node for allowed_node in AllowedNodeType)


def validate_doc(doc: ProsemirrorDocument, *, schema: Schema):
    """Validate that a value is a valid Prosemirror document according to the schema.

    Args:
        value: The document to validate (should be a dict)
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
