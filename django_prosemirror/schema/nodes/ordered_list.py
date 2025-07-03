"""Ordered list node definition."""

from prosemirror.model.schema import NodeSpec

from ..base import NodeDefinition


class OrderedListNode(NodeDefinition):
    """An ordered list."""

    @property
    def name(self) -> str:
        return "ordered_list"

    def to_dom(self, node) -> list:
        """Convert ordered list node to DOM representation."""
        attrs = self.class_mapping.apply_to_attrs(
            {"start": node.attrs["order"]} if "order" in node.attrs else {},
            "ordered_list",
        )
        return ["ol", attrs, 0] if attrs else ["ol", 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for ordered list."""
        return [
            {
                "tag": "ol",
                "getAttrs": lambda attrs: {
                    "start": attrs.get("start"),
                },
            }
        ]

    @property
    def spec(self) -> NodeSpec:
        return {
            "content": "list_item+",
            "group": "block",
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
