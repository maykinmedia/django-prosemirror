import { DOMOutputSpec, ParseRule } from "prosemirror-model";
import { type ClassMapping, MarkDefinition } from "@/schema/abstract";
import { MarkType } from "@/schema/types";

/**
 * Class that returns the spec of an italic mark.
 * Prosemirror processes this mark like this -> `<em>{ content }</em>`
 */
export class ItalicMark extends MarkDefinition {
    /** Italic font mark. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = MarkType.ITALIC;
    override parseDOM: ParseRule[] = [
        { tag: "i" },
        { tag: "em" },
        { style: "font-style=italic" },
        {
            style: "font-style=normal",
            clearMark: (m) => m.type.name == "em",
        },
    ];

    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return ["em", attrs, 0];
    }
}
