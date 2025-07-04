"""List item node definition."""

from prosemirror.model.schema import NodeSpec

from ..base import NodeDefinition


class ListItemNode(NodeDefinition):
    """A list item."""

    @property
    def name(self) -> str:
        return "list_item"

    def to_dom(self, node) -> list:
        """Convert list item node to DOM representation."""
        attrs = self.class_mapping.apply_to_attrs({}, "list_item")
        return ["li", attrs, 0] if attrs else ["li", 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for list item."""
        return [{"tag": "li"}]

    @property
    def spec(self) -> NodeSpec:
        return {
            "content": "paragraph block*",
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
            "defining": True,
        }
