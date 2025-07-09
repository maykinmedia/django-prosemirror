"""Table cell node definition."""

import re

from prosemirror.model.schema import NodeSpec

from ..base import NodeDefinition


class TableCellNode(NodeDefinition):
    """A table cell."""

    @property
    def name(self) -> str:
        return "table_cell"

    def _get_cell_attrs(self, element) -> dict:
        """Extract cell attributes from DOM element."""
        attrs = {}

        # Handle colspan
        colspan_str = element.get("colspan")
        if colspan_str:
            try:
                colspan = int(colspan_str)
                if colspan != 1:
                    attrs["colspan"] = colspan
            except (ValueError, TypeError):
                pass

        # Handle rowspan
        rowspan_str = element.get("rowspan")
        if rowspan_str:
            try:
                rowspan = int(rowspan_str)
                if rowspan != 1:
                    attrs["rowspan"] = rowspan
            except (ValueError, TypeError):
                pass

        # Handle colwidth from data-colwidth attribute
        width_attr = element.get("data-colwidth")
        if width_attr and re.match(r"^\d+(,\d+)*$", width_attr):
            try:
                widths = [int(s) for s in width_attr.split(",")]
                colspan = attrs.get("colspan", 1)
                if len(widths) == colspan:
                    attrs["colwidth"] = widths
            except (ValueError, TypeError):
                pass

        return attrs

    def _set_cell_attrs(self, node) -> dict:
        """Set DOM attributes from node attributes."""
        attrs = {}

        # Set colspan if not default
        if node.attrs.get("colspan", 1) != 1:
            attrs["colspan"] = str(node.attrs["colspan"])

        # Set rowspan if not default
        if node.attrs.get("rowspan", 1) != 1:
            attrs["rowspan"] = str(node.attrs["rowspan"])

        # Set data-colwidth if present
        if node.attrs.get("colwidth"):
            attrs["data-colwidth"] = ",".join(str(w) for w in node.attrs["colwidth"])

        return attrs

    def to_dom(self, node) -> list:
        """Convert table cell node to DOM representation."""
        attrs = self._set_cell_attrs(node)
        attrs = self.class_mapping.apply_to_attrs(attrs, "table_cell")
        return ["td", attrs, 0] if attrs else ["td", 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for table cell."""
        return [
            {
                "tag": "td",
                "getAttrs": self._get_cell_attrs,
            }
        ]

    @property
    def spec(self) -> NodeSpec:
        return {
            "content": "block+",  # Allow block content like paragraphs
            "attrs": {
                "colspan": {"default": 1},
                "rowspan": {"default": 1},
                "colwidth": {"default": None},
            },
            "isolating": True,
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
