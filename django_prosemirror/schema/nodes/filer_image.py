"""Image node definition."""

from prosemirror.model.schema import NodeSpec

from ...sanitize import is_safe_url
from ..base import NodeDefinition


class FilerImageNode(NodeDefinition):
    """An inline image node. Supports src, alt, and title attributes."""

    @property
    def name(self) -> str:
        return "filer_image"

    def to_dom(self, node) -> list:
        """Convert image node to DOM representation."""
        attrs = {}

        # Always include src (required attribute), unless it is a URL a browser
        # would treat as executable — an image without src renders inert.
        if "src" in node.attrs and is_safe_url(node.attrs["src"]):
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

        final_attrs = self.class_mapping.apply_to_attrs(attrs, "filer_image")
        return ["img", final_attrs]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for image."""
        return [
            {
                "tag": "img",
                # Returning False drops the image entirely; without a usable
                # src there is nothing left to render.
                "getAttrs": lambda attrs: (
                    {
                        "src": attrs.get("src"),
                        "title": attrs.get("title"),
                        "alt": attrs.get("alt", ""),
                        "imageId": attrs.get("imageId"),
                        "caption": attrs.get("caption", ""),
                    }
                    if is_safe_url(attrs.get("src"))
                    else False
                ),
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
