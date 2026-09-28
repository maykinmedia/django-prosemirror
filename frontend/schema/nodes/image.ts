import { DOMOutputSpec, Node, TagParseRule } from "prosemirror-model";
import { type ClassMapping, NodeDefinition } from "@/schema/abstract";
import { NodeType } from "@/schema/types";
import { isSafeUrl } from "@/utils/sanitize";

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
    src?: string;
    title: string | null;
}

/**
 * Class that returns the spec of a image node.
 * Prosemirror processes this node like ->
 * `<img src={attrs.src} alt={attrs.alt} title={attrs.title} />`
 */
export class FilerImageNode extends NodeDefinition {
    /** Image node. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = NodeType.FILER_IMAGE;
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
                const src = dom.getAttribute("src");
                // Returning false drops the image entirely; without a usable
                // src there is nothing left to render.
                if (!isSafeUrl(src)) return false;
                return {
                    src,
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
            title: node.attrs.title,
            alt: node.attrs.alt,
            id: node.attrs.imageId,
            // caption: node.attrs.caption,
        } as ImageDOMAttrs;
        // Emit src only when safe — an <img> without src renders inert
        // rather than executing a stored javascript: or data: URL.
        if (isSafeUrl(node.attrs.src)) nodeAttrs.src = node.attrs.src;

        let attrs = this.classMapping.apply_to_attrs(nodeAttrs, this.name);

        if (node.attrs.caption)
            attrs = { ...attrs, "data-caption": node.attrs.caption };
        return ["img", attrs];
    }
}
