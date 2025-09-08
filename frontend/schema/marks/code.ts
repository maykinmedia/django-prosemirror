import { DOMOutputSpec } from "prosemirror-model";
import { type ClassMapping, MarkDefinition } from "@/schema/abstract";
import { MarkType } from "@/schema/types";

/**
 * Class that returns the spec of a code mark.
 * Prosemirror processes this mark like this -> `<code>{ content }</code>`
 */
export class CodeMark extends MarkDefinition {
    /** Code font mark. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = MarkType.CODE;
    override parseDOM = [{ tag: "code" }];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return ["code", attrs, 0];
    }
}
