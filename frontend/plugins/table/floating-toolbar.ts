import { TableToolbar } from "@/components/table-toolbar";
import { Plugin, PluginKey } from "prosemirror-state";

// Plugin key for the floating table toolbar
export const tableToolbarKey = new PluginKey("tableToolbar");

/**
 * Plugin to manage the floating table toolbar
 */
export const tableToolbarPlugin = () =>
    new Plugin({
        key: tableToolbarKey,
        view(editorView) {
            const toolbar = new TableToolbar(editorView);
            // Initial update
            toolbar.update(editorView);

            return {
                update: (view, prevState) => {
                    // Only update if the selection has changed
                    if (
                        prevState &&
                        view.state.selection.eq(prevState.selection)
                    ) {
                        return;
                    }

                    toolbar.update(view);
                },
                destroy: () => {
                    toolbar.destroy();
                },
            };
        },
    });
