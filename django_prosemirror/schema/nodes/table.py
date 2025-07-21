"""Table node definition."""

from prosemirror.model.schema import NodeSpec

from ..base import NodeDefinition


class TableNode(NodeDefinition):
    """A table element containing table rows."""

    @property
    def name(self) -> str:
        return "table"

    def to_dom(self, node) -> list:
        """Convert table node to DOM representation."""
        attrs = self.class_mapping.apply_to_attrs({}, "table")
        return ["table", attrs, ["tbody", 0]] if attrs else ["table", ["tbody", 0]]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for table."""
        return [{"tag": "table"}]

    @property
    def spec(self) -> NodeSpec:
        return {
            "content": "table_row+",
            "isolating": True,
            "group": "block",
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
