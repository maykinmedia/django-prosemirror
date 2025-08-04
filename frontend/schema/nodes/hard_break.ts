import { DOMOutputSpec } from "prosemirror-model";
import { type ClassMapping, NodeDefinition } from "@/schema/abstract";
import { NodeType } from "@/schema/types";

/**
 * Class that returns the spec of a hard break node.
 * Prosemirror processes this node like -> `<br/>`
 */
export class HardBreakNode extends NodeDefinition {
    /** Hard break node. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = NodeType.HARD_BREAK;
    override group = "inline";
    override inline = true;
    override selectable = false;
    override parseDOM = [{ tag: "br" }];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return attrs ? ["br", attrs] : ["br"];
    }
}
