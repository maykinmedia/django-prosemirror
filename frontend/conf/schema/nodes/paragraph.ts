import { type ClassMapping, NodeDefinition } from "@/conf/schema/abstract";
import { NodeType } from "@/conf/types";
import { DOMOutputSpec } from "prosemirror-model";

/**
 * Class that returns the spec of a paragraph node.
 * Prosemirror processes this node like -> `<p>{ content }</p>`
 */
export class ParagraphNode extends NodeDefinition {
    /** Paragraph node. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = NodeType.PARAGRAPH;
    override content = "inline*";
    override group = "block";
    override parseDOM = [{ tag: "p" }];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return attrs ? ["p", attrs, 0] : ["p", 0];
    }
}
