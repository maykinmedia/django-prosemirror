import { EditorView } from "prosemirror-view";
import { NodeSelection } from "prosemirror-state";
import { Node } from "prosemirror-model";

/**
 * Check if an image node is currently selected
 */
export function isImageSelected(view: EditorView): boolean {
    // @ts-expect-error prop is available but not in this.view
    if (!view.focused) return false;

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
