"""Underline mark definition."""

from prosemirror.model.schema import MarkSpec

from ..base import MarkDefinition


class UnderlineMark(MarkDefinition):
    """An underline mark. Rendered as a <u> element."""

    @property
    def name(self) -> str:
        return "underline"

    def to_dom(self, mark, inline: bool) -> list:
        """Convert underline mark to DOM representation."""
        return ["u", 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for underline mark."""
        return [{"tag": "u"}, {"style": "text-decoration=underline"}]

    @property
    def spec(self) -> MarkSpec:
        return {
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
