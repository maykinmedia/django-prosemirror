"""Link mark definition."""

from prosemirror.model.schema import MarkSpec

from ..base import MarkDefinition


class LinkMark(MarkDefinition):
    """A link. Has href and optionally title attributes."""

    @property
    def name(self) -> str:
        return "link"

    def to_dom(self, mark, inline: bool) -> list:
        """Convert link mark to DOM representation."""
        base_attrs = {"href": mark.attrs["href"], "title": mark.attrs["title"]}
        attrs = self.class_mapping.apply_to_attrs(base_attrs, "link")
        return ["a", attrs, 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for link mark."""
        return [
            {
                "tag": "a",
                "getAttrs": lambda attrs: {
                    "href": attrs.get("href"),
                    "title": attrs.get("title"),
                },
            }
        ]

    @property
    def spec(self) -> MarkSpec:
        return {
            "attrs": {"href": {}, "title": {"default": None}},
            "inclusive": False,
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
