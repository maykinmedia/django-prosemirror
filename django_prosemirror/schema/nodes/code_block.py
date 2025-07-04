"""Code block node definition."""

from prosemirror.model.schema import NodeSpec

from ..base import NodeDefinition


class CodeBlockNode(NodeDefinition):
    """A code listing. Disallows marks or non-text inline nodes by default."""

    @property
    def name(self) -> str:
        return "code_block"

    def to_dom(self, node) -> list:
        """Convert code block node to DOM representation."""
        pre_attrs = self.class_mapping.apply_to_attrs({}, "code_block")
        code_attrs = self.class_mapping.apply_to_attrs({}, "code")

        code_element = ["code", code_attrs, 0] if code_attrs else ["code", 0]
        return ["pre", pre_attrs, code_element] if pre_attrs else ["pre", code_element]

    def dom_matcher(self) -> list:
        """Return DOM parsing rules for code block."""
        return [{"tag": "pre", "preserveWhitespace": "full"}]

    @property
    def spec(self) -> NodeSpec:
        return {
            "content": "text*",
            "marks": "",
            "group": "block",
            "code": True,
            "defining": True,
            "parseDOM": self.dom_matcher(),
            "toDOM": self.to_dom,
        }
