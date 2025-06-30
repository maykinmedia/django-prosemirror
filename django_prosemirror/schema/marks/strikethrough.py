"""Strikethrough mark definition."""

from prosemirror.model.schema import MarkSpec

from ..base import MarkDefinition


class StrikethroughMark(MarkDefinition):
    """A strikethrough mark. Rendered as <s> element."""

    @property
    def name(self) -> str:
        return "strikethrough"

    def to_dom(self, mark, inline: bool) -> list:
        """Convert strikethrough mark to DOM representation."""
        return ["s", 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for strikethrough mark."""
        return [
            {"tag": "s"},
            {"tag": "del"},
            {"tag": "strike"},
            {"style": "text-decoration=line-through"},
            {"style": "text-decoration-line=line-through"},
        ]

    @property
    def spec(self) -> MarkSpec:
        return {
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
