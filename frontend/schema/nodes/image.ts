import { DOMOutputSpec, Node, TagParseRule } from "prosemirror-model";
import { type ClassMapping, NodeDefinition } from "@/schema/abstract";
import { NodeType } from "@/schema/types";

/**
 * Class that returns the spec of a image node.
 * Prosemirror processes this node like ->
 * `<img src={attrs.src} alt={attrs.alt} title={attrs.title} />`
 */
export class ImageNode extends NodeDefinition {
    /** Image node. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = NodeType.IMAGE;
    override attrs = {
        src: { validate: "string" },
        alt: { default: "", validate: "string|null" },
        title: { default: null, validate: "string|null" },
    };
    override group = "inline";
    override inline = true;
    override draggable = true;
    override parseDOM: TagParseRule[] = [
        {
            tag: "img[src]",
            getAttrs(dom) {
                return {
                    src: dom.getAttribute("src"),
                    title: dom.getAttribute("title"),
                    alt: dom.getAttribute("alt"),
                };
            },
        },
    ];
    override toDOM(node: Node): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs(node.attrs, this.name);
        return ["img", attrs];
    }
}
