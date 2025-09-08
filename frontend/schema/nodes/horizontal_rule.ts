import { DOMOutputSpec } from "prosemirror-model";
import { type ClassMapping, NodeDefinition } from "@/schema/abstract";
import { NodeType } from "@/schema/types";

/**
 * Class that returns the spec of a horizontal rule node.
 * Prosemirror processes this node like -> `<hr/>`
 */
export class HorizontalRuleNode extends NodeDefinition {
    /** Horizontal rule node. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = NodeType.HORIZONTAL_RULE;
    override group = "block";
    override parseDOM = [{ tag: "hr" }];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return ["hr", attrs];
    }
}
