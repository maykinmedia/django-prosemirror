import { DOMOutputSpec, Node, TagParseRule } from "prosemirror-model";
import { type ClassMapping, NodeDefinition } from "@/schema/abstract";
import { NodeType } from "@/schema/types";

export type ImageNodeAttrs = {
    alt: string;
    caption: string | null;
    imageId: string;
    src: string;
    title: string | null;
};

export interface ImageDOMAttrs extends Record<string, unknown> {
    alt: string;
    caption: string | null;
    id: string;
    src: string;
    title: string | null;
}

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
        alt: { default: "", validate: "string|null" },
        caption: { default: null, validate: "string|null" },
        imageId: { default: null, validate: "string" },
        src: { validate: "string" },
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
                    imageId: dom.getAttribute("id"),
                    caption: dom.dataset?.caption ?? null,
                };
            },
        },
    ];
    override toDOM(node: Node): DOMOutputSpec {
        const nodeAttrs = {
            src: node.attrs.src,
            title: node.attrs.title,
            alt: node.attrs.alt,
            id: node.attrs.imageId,
            // caption: node.attrs.caption,
        } as ImageDOMAttrs;

        let attrs = this.classMapping.apply_to_attrs(nodeAttrs, this.name);

        if (node.attrs.caption)
            attrs = { ...attrs, "data-caption": node.attrs.caption };
        return ["img", attrs];
    }
}
