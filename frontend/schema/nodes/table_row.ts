import { DOMOutputSpec } from "prosemirror-model";
import { type ClassMapping, NodeDefinition } from "@/schema/abstract";
import { NodeType } from "@/schema/types";
import { TableRole } from "prosemirror-tables";

const TABLE_ROLE: TableRole = "row";

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
    override tableRole = TABLE_ROLE;
    override parseDOM = [{ tag: "tr" }];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return ["tr", attrs, 0];
    }
}
