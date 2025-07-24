import { type ClassMapping, NodeDefinition } from "@/conf/schema/abstract";
import { NodeType } from "@/conf/types";
import { DOMOutputSpec } from "prosemirror-model";
import { TableRole } from "prosemirror-tables";

/**
 * Class that returns the spec of a table row node.
 * Prosemirror processes this node like -> `<tr>{ content }</tr>`
 */
export class TableRowNode extends NodeDefinition {
    /** Table row node. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = NodeType.TABLE_ROW;
    override content = "(table_cell | table_header)*";
    override tableRole = "row" as TableRole;
    override parseDOM = [{ tag: "tr" }];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return ["tr", attrs, 0];
    }
}
