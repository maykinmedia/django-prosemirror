import { type ClassMapping, NodeDefinition } from "@/conf/schema/abstract";
import { NodeType } from "@/conf/types";
import { DOMOutputSpec, Node, TagParseRule } from "prosemirror-model";

/**
 * Class that returns the spec of an ordered list node.
 * Prosemirror processes this node like ->
 * `<ol start={attrs.start}>{ content }</ol>`
 */
export class OrderedListNode extends NodeDefinition {
    /** Ordered list node. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = NodeType.ORDERED_LIST;
    override attrs = { order: { default: 1, validate: "number" } };
    override content = "list_item+";
    override group = "block";
    override parseDOM: TagParseRule[] = [
        {
            tag: "ol",
            getAttrs(dom) {
                return {
                    order: dom.hasAttribute("start")
                        ? +dom.getAttribute("start")!
                        : 1,
                };
            },
        },
    ];
    override toDOM(node: Node): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs(
            { start: node?.attrs?.order ?? 1 },
            this.name,
        );
        return ["ol", attrs, 0];
    }
}
