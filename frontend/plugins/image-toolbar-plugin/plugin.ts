import { CreateMenuItems, ToolbarInstance } from "@/plugins/toolbar-plugin";
import { ImageDOMAttrs } from "@/schema/nodes/image";
import { getSelectedImageNode, isImageSelected } from "@/utils";
import { Node } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";

// Plugin key for the floating image toolbar
export const imageToolbarKey = new PluginKey("floatingImageToolbar");

/**
 * Plugin to manage the floating image toolbar
 * Depends on toolbar plugin being available via pluginMethods
 */
export const imageToolbarPlugin = (
    config: CreateMenuItems<Node, ImageDOMAttrs>,
) => {
    return new Plugin({
        key: imageToolbarKey,
        view() {
            let toolbar: ToolbarInstance | null = null;
            return {
                update: (view, prevState) => {
                    try {
                        const createToolbar =
                            view.state["toolbar-plugin$"]?.createToolbar;

                        // Only update if createToolbar is defined and the selection has changed
                        if (
                            !createToolbar ||
                            (prevState &&
                                view.state.selection.eq(prevState.selection))
                        ) {
                            return;
                        }

                        const imageSelected = isImageSelected(view);
                        const imageNode = getSelectedImageNode(view);

                        // Destroy existing toolbar if it exists
                        if (toolbar) {
                            toolbar.destroy();
                            toolbar = null;
                        }

                        // Create new toolbar if an image is selected
                        if (imageSelected && imageNode) {
                            toolbar = createToolbar(
                                view,
                                imageNode,
                                config,
                                isImageSelected,
                            );
                        }
                    } catch (err) {
                        console.error("Could not create image toolbar:", err);
                        toolbar = null;
                    }
                },
                destroy: () => {
                    if (toolbar) {
                        toolbar.destroy();
                        toolbar = null;
                    }
                },
            };
        },
    });
};
