import {
    AttributeSpec,
    DOMOutputSpec,
    Mark,
    ParseRule,
} from "prosemirror-model";
import { type ClassMapping, MarkDefinition } from "@/conf/schema/abstract";
import { MarkType } from "@/conf/types";

/**
 * Class that returns the spec of a code mark.
 * Prosemirror processes this mark like this ->
 * `<a href={attrs.href} title={attrs.title}>{ content }</a>`
 */
export class LinkMark extends MarkDefinition {
    /** Link mark. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = MarkType.CODE;
    override inclusive?: boolean | undefined = false;
    override attrs?: { [name: string]: AttributeSpec } | undefined = {
        href: { validate: "string" },
        title: { default: null, validate: "string|null" },
    };
    override parseDOM: ParseRule[] = [
        {
            tag: "a[href]",
            getAttrs(dom) {
                return {
                    href: dom.getAttribute("href"),
                    title: dom.getAttribute("title"),
                };
            },
        },
    ];
    override toDOM(mark: Mark): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs(
            {
                href: mark?.attrs.href,
                title: mark?.attrs.title,
            },
            this.name,
        );
        return attrs ? ["a", attrs, 0] : ["a", 0];
    }
}
