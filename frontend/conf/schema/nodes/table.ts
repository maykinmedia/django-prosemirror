import { type ClassMapping, NodeDefinition } from "@/conf/schema/abstract";
import { NodeType } from "@/conf/types";
import { DOMOutputSpec } from "prosemirror-model";
import { TableRole } from "prosemirror-tables";

/**
 * Class that returns the spec of a table node.
 * Prosemirror processes this node like -> `<table><tbody>{ content }</tbody></table>`
 */
export class TableNode extends NodeDefinition {
    /** Paragraph node. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = NodeType.TABLE;
    override content = "table_row+";
    override group = "block";
    override isolating = true;
    override tableRole = "table" as TableRole;
    override parseDOM = [{ tag: "table" }];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return ["table", attrs, ["tbody", 0]];
    }
}
