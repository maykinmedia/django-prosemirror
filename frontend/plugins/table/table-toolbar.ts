import { Plugin, PluginKey } from "prosemirror-state";
import {
    isHeaderColumnActive,
    isHeaderRowActive,
    TableToolbar,
} from "@/components/table-toolbar";

// Plugin key for the floating table toolbar
export const tableToolbarKey = new PluginKey("floatingTableToolbar");

/**
 * Plugin to manage the floating table toolbar
 */
export const tableToolbarPlugin = () => {
    return new Plugin({
        key: tableToolbarKey,
        view(editorView) {
            // Start with true to make sure there is an update if the row/column is not a th.
            let isRowHeader = true;
            let isColumnHeader = true;

            const toolbar = new TableToolbar(editorView);
            // Initial update
            toolbar.render(editorView);

            return {
                update: (view, prevState) => {
                    const newIsRowHeader = isHeaderRowActive(view);
                    const newIsColumnHeader = isHeaderColumnActive(view);

                    // Only update if the selection has changed
                    // or if the current selection changed from
                    // `td -> th` or `th -> td`.
                    if (
                        prevState &&
                        view.state.selection.eq(prevState.selection) &&
                        isRowHeader === newIsRowHeader &&
                        isColumnHeader === newIsColumnHeader
                    ) {
                        return;
                    }

                    isRowHeader = newIsRowHeader;
                    isColumnHeader = newIsColumnHeader;

                    toolbar.render(view);
                },
                destroy: () => {
                    toolbar.destroy();
                },
            };
        },
    });
};
