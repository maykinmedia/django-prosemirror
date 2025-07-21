"""Table row node definition."""

from prosemirror.model.schema import NodeSpec

from ..base import NodeDefinition


class TableRowNode(NodeDefinition):
    """A table row containing table cells and headers."""

    @property
    def name(self) -> str:
        return "table_row"

    def to_dom(self, node) -> list:
        """Convert table row node to DOM representation."""
        attrs = self.class_mapping.apply_to_attrs({}, "table_row")
        return ["tr", attrs, 0] if attrs else ["tr", 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for table row."""
        return [{"tag": "tr"}]

    @property
    def spec(self) -> NodeSpec:
        return {
            "content": "(table_cell | table_header)*",
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
