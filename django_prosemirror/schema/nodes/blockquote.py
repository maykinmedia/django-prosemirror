"""Blockquote node definition."""

from prosemirror.model.schema import NodeSpec

from ..base import NodeDefinition


class BlockquoteNode(NodeDefinition):
    """A blockquote wrapping one or more blocks."""

    @property
    def name(self) -> str:
        return "blockquote"

    def to_dom(self, node) -> list:
        """Convert blockquote node to DOM representation."""
        attrs = self.class_mapping.apply_to_attrs({}, "blockquote")
        return ["blockquote", attrs, 0] if attrs else ["blockquote", 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for blockquote."""
        return [{"tag": "blockquote"}]

    @property
    def spec(self) -> NodeSpec:
        return {
            "content": "block+",
            "group": "block",
            "defining": True,
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
