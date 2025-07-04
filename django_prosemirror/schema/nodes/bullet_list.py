"""Bullet list node definition."""

from prosemirror.model.schema import NodeSpec

from ..base import NodeDefinition


class BulletListNode(NodeDefinition):
    """A bullet list."""

    @property
    def name(self) -> str:
        return "bullet_list"

    def to_dom(self, node) -> list:
        """Convert bullet list node to DOM representation."""
        attrs = self.class_mapping.apply_to_attrs({}, "bullet_list")
        return ["ul", attrs, 0] if attrs else ["ul", 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for bullet list."""
        return [{"tag": "ul"}]

    @property
    def spec(self) -> NodeSpec:
        return {
            "content": "list_item+",
            "group": "block",
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
