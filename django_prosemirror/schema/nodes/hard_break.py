"""Hard break node definition."""

from prosemirror.model.schema import NodeSpec

from ..base import NodeDefinition


class HardBreakNode(NodeDefinition):
    """A hard line break."""

    @property
    def name(self) -> str:
        return "hard_break"

    def to_dom(self, node) -> list:
        """Convert hard break node to DOM representation."""
        return ["br"]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for hard break."""
        return [{"tag": "br"}]

    @property
    def spec(self) -> NodeSpec:
        return {
            "inline": True,
            "group": "inline",
            "selectable": False,
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
