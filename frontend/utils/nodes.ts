/**
 * Utility file to access and validate multiple nodes
 */
import { ImageNodeAttrs } from "@/schema/nodes/image";
import { Node } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { findParentNodeOfType } from "prosemirror-utils";
import {
    columnIsHeader,
    isInTable,
    rowIsHeader,
    selectedRect,
} from "prosemirror-tables";

/**
 * Check if an image node is currently selected
 */
export function isImageSelected(view: EditorView): boolean {
    // @ts-expect-error prop is available but not in this.view
    if (!view?.focused) return false;

    const { selection } = view.state;
    return (
        selection instanceof NodeSelection &&
        selection.node.type.name === "image"
    );
}

/**
 * Get the currently selected image node
 */
export function getSelectedImageNode(view: EditorView): Node | null {
    const { selection } = view.state;
    if (
        selection instanceof NodeSelection &&
        selection.node.type.name === "image"
    ) {
        return selection.node;
    }
    return null;
}

export function insertImage(attrs: ImageNodeAttrs, view: EditorView): void {
    const node = view.state.schema.nodes.image.create(attrs);
    const transaction = view.state.tr
        .replaceSelectionWith(node)
        .scrollIntoView();
    view.dispatch(transaction);
}

/**
 * Get the currently selected table node
 */
export function getSelectedTableNode(view: EditorView): Node | null {
    const { selection } = view.state;

    // Check if table is directly selected
    if (
        selection instanceof NodeSelection &&
        selection.node.type.name === "table"
    ) {
        return selection.node;
    }

    // Find parent table node
    const tableParent = findParentNodeOfType(view.state.schema.nodes.table)(
        selection,
    );

    return tableParent ? tableParent.node : null;
}

/**
 * Helper function that returns a boolean
 * indicating the current selected is inside a table.
 */
export function isInsideTable(view: EditorView): boolean {
    // @ts-expect-error prop is available but not in this.view
    if (!view.focused) return false;
    return isInTable(view.state);
}

/**
 * Helper function that returns a boolean
 * indicating if the current selected row cells are header_cells
 */
export function isHeaderRowActive(view: EditorView): boolean {
    const tableRect = selectedRect(view.state);
    return rowIsHeader(tableRect.map, tableRect.table, tableRect.top);
}

/**
 * Helper function that returns a boolean
 * indicating if the current selected column cells are header_cells
 */
export function isHeaderColumnActive(view: EditorView): boolean {
    const tableRect = selectedRect(view.state);
    return columnIsHeader(tableRect.map, tableRect.table, tableRect.left);
}
