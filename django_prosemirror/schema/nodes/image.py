"""Image node definition."""

from prosemirror.model.schema import NodeSpec

from ..base import NodeDefinition


class ImageNode(NodeDefinition):
    """An inline image node. Supports src, alt, and title attributes."""

    @property
    def name(self) -> str:
        return "image"

    def to_dom(self, node) -> list:
        """Convert image node to DOM representation."""
        base_attrs = {
            "src": node.attrs["src"],
            "alt": node.attrs["alt"],
            "title": node.attrs["title"],
        }
        attrs = self.class_mapping.apply_to_attrs(base_attrs, "image")
        return ["img", attrs]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for image."""
        return [
            {
                "tag": "img",
                "getAttrs": lambda attrs: {
                    "src": attrs.get("src"),
                    "title": attrs.get("title"),
                    "alt": attrs.get("alt"),
                },
            },
        ]

    @property
    def spec(self) -> NodeSpec:
        return {
            "inline": True,
            "attrs": {"src": {}, "alt": {"default": ""}, "title": {"default": None}},
            "group": "inline",
            "draggable": True,
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
