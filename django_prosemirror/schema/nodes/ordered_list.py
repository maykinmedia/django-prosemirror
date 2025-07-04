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
        attrs = {}
        start_val = node.attrs.get("start")
        if start_val is not None and start_val != 1:
            attrs["start"] = str(start_val)

        attrs = self.class_mapping.apply_to_attrs(attrs, "ordered_list")
        return ["ol", attrs, 0] if attrs else ["ol", 0]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for ordered list."""

        def get_attrs(element):
            start_attr = element.get("start")
            if start_attr is not None:
                try:
                    start_val = int(start_attr)
                    return {"start": start_val}
                except (ValueError, TypeError):
                    pass  # Ignore invalid values
            return {}  # Return empty dict for default case

        return [
            {
                "tag": "ol",
                "getAttrs": get_attrs,
            }
        ]

    @property
    def spec(self) -> NodeSpec:
        return {
            "content": "list_item+",
            "group": "block",
            "attrs": {
                "start": {"default": 1},
            },
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
