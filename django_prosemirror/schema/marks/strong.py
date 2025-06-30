"""Strong mark definition."""

from prosemirror.model.schema import MarkSpec

from ..base import MarkDefinition


class StrongMark(MarkDefinition):
    """A strong mark. Parse rules also match <b> and font-weight: bold."""

    @property
    def name(self) -> str:
        return "strong"

    def to_dom(self, mark, inline: bool) -> list:
        """Convert strong mark to DOM representation."""
        return ["strong", 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for strong mark."""
        return [{"tag": "strong"}, {"tag": "b"}, {"style": "font-weight"}]

    @property
    def spec(self) -> MarkSpec:
        return {
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
