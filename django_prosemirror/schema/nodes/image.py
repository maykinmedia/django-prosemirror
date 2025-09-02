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
        attrs = {}

        # Always include src (required attribute)
        if "src" in node.attrs:
            attrs["src"] = node.attrs["src"]

        # Only include optional attributes if they don't match defaults
        if node.attrs.get("alt") != "":
            attrs["alt"] = node.attrs["alt"]

        if node.attrs.get("title") is not None:
            attrs["title"] = node.attrs["title"]

        if node.attrs.get("imageId") is not None:
            attrs["imageId"] = node.attrs["imageId"]

        if node.attrs.get("caption") != "":
            attrs["caption"] = node.attrs["caption"]

        final_attrs = self.class_mapping.apply_to_attrs(attrs, "image")
        return ["img", final_attrs]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for image."""
        return [
            {
                "tag": "img",
                "getAttrs": lambda attrs: {
                    "src": attrs.get("src"),
                    "title": attrs.get("title"),
                    "alt": attrs.get("alt"),
                    "imageId": attrs.get("imageId"),
                    "caption": attrs.get("caption"),
                },
            },
        ]

    @property
    def spec(self) -> NodeSpec:
        return {
            "inline": True,
            "attrs": {
                "src": {},
                "alt": {"default": ""},
                "title": {"default": None},
                "imageId": {"default": None},
                "caption": {"default": ""},
            },
            "group": "inline",
            "draggable": True,
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
