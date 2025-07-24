import { DOMOutputSpec } from "prosemirror-model";
import { type ClassMapping, MarkDefinition } from "@/conf/schema/abstract";
import { MarkType } from "@/conf/types";

/**
 * Class that returns the spec of a strikethrough mark.
 * Prosemirror processes this mark like this -> `<s>{ content }</s>`
 */
export class StrikeThroughMark extends MarkDefinition {
    /** Strike through mark. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = MarkType.STRIKETHROUGH;
    override parseDOM = [
        { tag: "s" },
        { tag: "del" },
        { tag: "strike" },
        { style: "text-decoration=line-through" },
        { style: "text-decoration-line=line-through" },
    ];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return attrs ? ["s", attrs, 0] : ["s", 0];
    }
}
