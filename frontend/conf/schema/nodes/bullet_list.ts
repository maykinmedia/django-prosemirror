import { DOMOutputSpec } from "prosemirror-model";
import { type ClassMapping, NodeDefinition } from "@/conf/schema/abstract";
import { NodeType } from "@/conf/types";

/**
 * Class that returns the spec of a bullet list node.
 * Prosemirror processes this node like -> `<ol>{ content }</ol>`
 */
export class BulletListNode extends NodeDefinition {
    /** Bullet/unordered list node. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = NodeType.BULLET_LIST;
    override content = "list_item+";
    override group = "block";
    override parseDOM = [{ tag: "ul" }];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return attrs ? ["ul", attrs, 0] : ["ul", 0];
    }
}
