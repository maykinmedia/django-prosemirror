import { DOMOutputSpec } from "prosemirror-model";
import { type ClassMapping, NodeDefinition } from "@/schema/abstract";
import { NodeType } from "@/schema/types";
import { TableRole } from "prosemirror-tables";

const TABLE_ROLE: TableRole = "table";

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
    override tableRole = TABLE_ROLE;
    override parseDOM = [{ tag: "table" }];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs({}, this.name);
        return ["table", attrs, ["tbody", 0]];
    }
}
