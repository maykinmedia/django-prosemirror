import { DOMOutputSpec, Node } from "prosemirror-model";
import { type ClassMapping, NodeDefinition } from "@/schema/abstract";
import { NodeType } from "@/schema/types";

/**
 * Class that returns the spec of a heading node.
 * Prosemirror processes this node like -> `<h1>{ content }</h1>`
 */
export class HeadingNode extends NodeDefinition {
    /** Heading node. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = NodeType.HEADING;
    override attrs = {
        level: { default: 1, validate: "number" },
    };
    override content = "inline*";
    override defining = true;
    override group = "block";
    override parseDOM = [
        { tag: "h1", attrs: { level: 1 } },
        { tag: "h2", attrs: { level: 2 } },
        { tag: "h3", attrs: { level: 3 } },
        { tag: "h4", attrs: { level: 4 } },
        { tag: "h5", attrs: { level: 5 } },
        { tag: "h6", attrs: { level: 6 } },
    ];
    override toDOM(node: Node): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        // const level = node?.attrs?.level ?? 1;
        return ["h" + (node?.attrs?.level ?? 1), attrs, 0];
    }
}
