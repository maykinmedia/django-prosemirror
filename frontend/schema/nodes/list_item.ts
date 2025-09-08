import { DOMOutputSpec } from "prosemirror-model";
import { type ClassMapping, NodeDefinition } from "@/schema/abstract";
import { NodeType } from "@/schema/types";

/**
 * Class that returns the spec of a heading node.
 * Prosemirror processes this node like -> `<h1>{ content }</h1>`
 */
export class ListItemNode extends NodeDefinition {
    /** Heading node. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = NodeType.LIST_ITEM;
    override content = "paragraph block*";
    override defining = true;
    override parseDOM = [{ tag: "li" }];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return ["li", attrs, 0];
    }
}
