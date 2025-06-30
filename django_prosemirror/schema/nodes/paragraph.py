"""Paragraph node definition."""

from prosemirror.model.schema import NodeSpec

from ..base import NodeDefinition


class ParagraphNode(NodeDefinition):
    """A plain paragraph textblock."""

    @property
    def name(self) -> str:
        return "paragraph"

    def to_dom(self, node) -> list:
        """Convert paragraph node to DOM representation."""
        attrs = self.class_mapping.apply_to_attrs({}, "paragraph")
        return ["p", attrs, 0] if attrs else ["p", 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for paragraph."""
        return [{"tag": "p"}]

    @property
    def spec(self) -> NodeSpec:
        return {
            "content": "inline*",
            "group": "block",
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
