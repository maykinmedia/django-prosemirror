"""Heading node definition."""

from prosemirror.model.schema import NodeSpec

from ..base import NodeDefinition


class HeadingNode(NodeDefinition):
    """A heading textblock, with a level attribute that should hold number 1 to 6."""

    @property
    def name(self) -> str:
        return "heading"

    def to_dom(self, node) -> list:
        """Convert heading node to DOM representation."""
        level = node.attrs.get("level", 1)
        base_class = self.class_mapping.get("heading")
        class_key = f"{base_class}-{level}" if base_class else ""

        attrs = {}
        if class_key:
            attrs["class"] = class_key

        return [f"h{level}", attrs, 0] if attrs else [f"h{level}", 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for heading."""
        return [
            {"tag": "h1", "attrs": {"level": 1}},
            {"tag": "h2", "attrs": {"level": 2}},
            {"tag": "h3", "attrs": {"level": 3}},
            {"tag": "h4", "attrs": {"level": 4}},
            {"tag": "h5", "attrs": {"level": 5}},
            {"tag": "h6", "attrs": {"level": 6}},
        ]

    @property
    def spec(self) -> NodeSpec:
        return {
            "attrs": {"level": {"default": 1}},
            "content": "inline*",
            "group": "block",
            "defining": True,
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
