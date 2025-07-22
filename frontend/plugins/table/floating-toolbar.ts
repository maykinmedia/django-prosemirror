import { Plugin, PluginKey } from "prosemirror-state";
import { FloatingTableToolbar } from "@/components/floating-table-toolbar";

// Plugin key for the floating table toolbar
export const floatingTableToolbarKey = new PluginKey("floatingTableToolbar");

/**
 * Plugin to manage the floating table toolbar
 */
export const floatingTableToolbarPlugin = () =>
    new Plugin({
        key: floatingTableToolbarKey,
        view(editorView) {
            const toolbar = new FloatingTableToolbar(editorView);
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
