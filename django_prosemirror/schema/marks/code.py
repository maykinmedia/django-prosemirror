"""Code mark definition."""

from prosemirror.model.schema import MarkSpec

from ..base import MarkDefinition


class CodeMark(MarkDefinition):
    """Code font mark."""

    @property
    def name(self) -> str:
        return "code"

    def to_dom(self, mark, inline: bool) -> list:
        """Convert code mark to DOM representation."""
        attrs = self.class_mapping.apply_to_attrs({}, "code")
        return ["code", attrs, 0] if attrs else ["code", 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for code mark."""
        return [{"tag": "code"}]

    @property
    def spec(self) -> MarkSpec:
        return {
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
