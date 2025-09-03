/**
 * Utility file to access and validate multiple nodes
 *
 *
 *  TODO move `isInsideTable` to this file.
 */
import { ImageNodeAttrs } from "@/schema/nodes/image";
import { Node } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

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
