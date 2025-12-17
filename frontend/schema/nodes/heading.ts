import { DOMOutputSpec, Node } from "prosemirror-model";
import { type ClassMapping, NodeDefinition } from "@/schema/abstract";
import { NodeType } from "@/schema/types";
import { DPMSettings } from "../settings";

/**
 * Class that returns the spec of a heading node.
 * Prosemirror processes this node like -> `<h1>{ content }</h1>`
 */
export class HeadingNode extends NodeDefinition {
    /** Heading node. */
    constructor(classes: ClassMapping, settings?: DPMSettings) {
        super(classes, settings);
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

        const minLevel = this.settings?.minHeadingLevel ?? 1;
        const maxLevel = this.settings?.maxHeadingLevel ?? 6;

        // Prevent smaller/larger heading generation than settings
        if (node.attrs.level < minLevel || node.attrs.level > maxLevel)
            return ["h" + minLevel, attrs, 0];

        return ["h" + (node?.attrs?.level ?? 1), attrs, 0];
    }
}
