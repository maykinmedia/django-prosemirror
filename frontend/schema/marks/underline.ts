import { DOMOutputSpec } from "prosemirror-model";
import { type ClassMapping, MarkDefinition } from "@/schema/abstract";
import { MarkType } from "@/schema/types";

/**
 * Class that returns the spec of a underline mark.
 * Prosemirror processes this mark like this -> `<u>{ content }</u>`
 */
export class UnderlineMark extends MarkDefinition {
    /** Underline text mark. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = MarkType.UNDERLINE;
    override parseDOM = [{ tag: "u" }, { style: "text-decoration=underline" }];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return ["u", attrs, 0];
    }
}
