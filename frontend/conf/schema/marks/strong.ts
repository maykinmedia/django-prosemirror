import { DOMOutputSpec, ParseRule } from "prosemirror-model";
import { type ClassMapping, MarkDefinition } from "@/conf/schema/abstract";
import { MarkType } from "@/conf/types";

/**
 * Class that returns the spec of a strong mark.
 * Prosemirror processes this mark like this -> `<strong>{ content }</strong>`
 */
export class StrongMark extends MarkDefinition {
    /** Strong font mark. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = MarkType.STRONG;
    override parseDOM: ParseRule[] = [
        { tag: "strong" },
        // This works around a Google Docs misbehavior where
        // pasted content will be inexplicably wrapped in `<b>`
        // tags with a font-weight normal.
        {
            tag: "b",
            getAttrs: (node) => node.style.fontWeight != "normal" && null,
        },
        {
            style: "font-weight=400",
            clearMark: (m) => m.type.name == "strong",
        },
        {
            style: "font-weight",
            getAttrs: (value) =>
                /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
        },
    ];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return attrs ? ["strong", attrs, 0] : ["strong", 0];
    }
}
