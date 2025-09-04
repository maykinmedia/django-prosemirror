import { DOMOutputSpec } from "prosemirror-model";
import { type ClassMapping, NodeDefinition } from "@/schema/abstract";
import { NodeType } from "@/schema/types";

/**
 * Class that returns the spec of a blockquote node.
 * Prosemirror processes this node like -> `<blockquote>{ content }</blockquote>`
 */
export class BlockQuoteNode extends NodeDefinition {
    /** Blockquote node. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = NodeType.BLOCKQUOTE;
    override content = "block+";
    override defining = true;
    override group = "block";
    override parseDOM = [{ tag: "blockquote" }];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return ["blockquote", attrs, 0];
    }
}
