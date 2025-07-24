import { type ClassMapping, MarkDefinition } from "@/conf/schema/abstract";
import { MarkType } from "@/conf/types";
import { DOMOutputSpec } from "prosemirror-model";

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
        return attrs ? ["u", attrs, 0] : ["u", 0];
    }
}
