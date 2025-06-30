"""Italic mark definition."""

from prosemirror.model.schema import MarkSpec

from ..base import MarkDefinition


class ItalicMark(MarkDefinition):
    """An emphasis mark. Has parse rules that also match <i> and font-style: italic."""

    @property
    def name(self) -> str:
        return "em"

    def to_dom(self, mark, inline: bool) -> list:
        """Convert italic mark to DOM representation."""
        return ["em", 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for italic mark."""
        return [{"tag": "i"}, {"tag": "em"}, {"style": "font-style=italic"}]

    @property
    def spec(self) -> MarkSpec:
        return {
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
