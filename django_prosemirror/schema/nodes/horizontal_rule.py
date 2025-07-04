"""Horizontal rule node definition."""

from prosemirror.model.schema import NodeSpec

from ..base import NodeDefinition


class HorizontalRuleNode(NodeDefinition):
    """A horizontal rule."""

    @property
    def name(self) -> str:
        return "horizontal_rule"

    def to_dom(self, node) -> list:
        """Convert horizontal rule node to DOM representation."""
        attrs = self.class_mapping.apply_to_attrs({}, "horizontal_rule")
        return ["hr", attrs] if attrs else ["hr"]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for horizontal rule."""
        return [{"tag": "hr"}]

    @property
    def spec(self) -> NodeSpec:
        return {
            "group": "block",
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
