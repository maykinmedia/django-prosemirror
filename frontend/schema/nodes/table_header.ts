import { DOMOutputSpec, Node, TagParseRule } from "prosemirror-model";
import { type ClassMapping, NodeDefinition } from "@/schema/abstract";
import { NodeType } from "@/schema/types";
import { MutableAttrs, TableRole } from "prosemirror-tables";

const TABLE_ROLE: TableRole = "header_cell";

/**
 * Class that returns the spec of a table header node.
 * Prosemirror processes this node like -> `<th>{ content }</th>`
 */
export class TableHeaderNode extends NodeDefinition {
    /** Paragraph node. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = NodeType.TABLE_HEADER;
    override attrs = {
        colspan: { default: 1 },
        rowspan: { default: 1 },
        colwidth: { default: null },
    };
    override content = "block+";
    override isolating = true;
    override tableRole = TABLE_ROLE;
    override parseDOM: TagParseRule[] = [
        {
            tag: "th",
            getAttrs: this._getCellAttrs.bind(this),
        },
    ];
    override toDOM(node: Node): DOMOutputSpec {
        let attrs = this._setCellAttrs(node);
        attrs = this.classMapping.apply_to_attrs(attrs, this.name);
        return attrs ? ["th", attrs, 0] : ["th", 0];
    }

    private _getCellAttrs(element: HTMLElement) {
        if (typeof element === "string") {
            return {};
        }
        const widthAttr = element.getAttribute("data-colwidth");
        const widths =
            widthAttr && /^\d+(,\d+)*$/.test(widthAttr)
                ? widthAttr.split(",").map((s) => Number(s))
                : null;
        const colspan = Number(element.getAttribute("colspan") || 1);

        const attrs: MutableAttrs = {
            colspan,
            rowspan: Number(element.getAttribute("rowspan") || 1),
            colwidth: widths && widths.length == colspan ? widths : null,
        };
        return attrs;
    }

    private _setCellAttrs(node: Node) {
        const attrs: MutableAttrs = {};
        if (node.attrs.colspan != 1) attrs.colspan = node.attrs.colspan;
        if (node.attrs.rowspan != 1) attrs.rowspan = node.attrs.rowspan;
        if (node.attrs.colwidth)
            attrs["data-colwidth"] = node.attrs.colwidth.join(",");
        return attrs;
    }
}
