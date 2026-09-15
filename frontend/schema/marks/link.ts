import {
    AttributeSpec,
    DOMOutputSpec,
    Mark,
    ParseRule,
} from "prosemirror-model";
import { type ClassMapping, MarkDefinition } from "@/schema/abstract";
import { MarkType } from "@/schema/types";
import { isSafeUrl, sanitizeUrl } from "@/utils/sanitize";

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
                const href = dom.getAttribute("href");
                // Returning false drops the mark, keeping the text unlinked.
                if (!isSafeUrl(href)) return false;
                return {
                    href,
                    title: dom.getAttribute("title"),
                };
            },
        },
    ];
    override toDOM(mark: Mark): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs(
            {
                // Documents stored before href validation existed may still
                // hold an executable URL, so neutralise rather than throw
                // while rendering.
                href: sanitizeUrl(mark?.attrs.href),
                title: mark?.attrs.title,
            },
            this.name,
        );
        return ["a", attrs, 0];
    }
}
