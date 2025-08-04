import { type Schema } from "prosemirror-model";
import { imageDragAndCopyPlugin } from "./image-drag-and-copy";
import { imageKeymap } from "./image-keymap";

/**
 * ## Create image plugins
 *
 * 1. Drag and copy handled and uploaded.
 * 2. Floating toolbar for selected images.
 * 3. Keyboard shortcuts for image operations.
 */
export function imagePlugins(schema: Schema) {
    if (!schema.nodes.image) return [];

    return [imageDragAndCopyPlugin(schema), imageKeymap(schema)];
}
