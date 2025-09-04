import { CreateMenuItems, ToolbarInstance } from "@/plugins/toolbar-plugin";
import { ImageDOMAttrs } from "@/schema/nodes/image";
import { getSelectedTableNode, isImageSelected, isInsideTable } from "@/utils";
import { Node } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";

// Plugin key for the floating table toolbar
export const tableToolbarKey = new PluginKey("floatingTableToolbar");

/**
 * Plugin to manage the floating image toolbar
 * Depends on toolbar plugin being available via pluginMethods
 */
export const tableToolbarPlugin = (
    config: CreateMenuItems<Node, ImageDOMAttrs>,
) => {
    return new Plugin({
        key: tableToolbarKey,
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

                        const tableSelected = isInsideTable(view);
                        const tableNode = getSelectedTableNode(view);

                        // Destroy existing toolbar if it exists
                        if (toolbar) {
                            toolbar.destroy();
                            toolbar = null;
                        }

                        // Create new toolbar if an image is selected
                        if (tableSelected && tableNode) {
                            toolbar = createToolbar(
                                view,
                                tableNode,
                                config,
                                isImageSelected,
                            );

                            console.log(toolbar);
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
