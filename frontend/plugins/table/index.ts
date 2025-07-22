import { columnResizing, goToNextCell, tableEditing } from "prosemirror-tables";
import { keymap } from "prosemirror-keymap";
import { floatingTableToolbarPlugin } from "./floating-toolbar";

/**
 * ## Create table plugins
 *
 * 1. columnResizing:
 *     - allow the columns to be resized
 *
 * 2. tableEditing:
 *      - enables cell-selection, handles cell-based copy/paste,
 *        and makes sure tables stay well-formed (each row has
 *        the same width, and cells don't overlap)
 *
 * 3. keymap
 *      - "Tab": Move to the next cell.
 *      - "Shift-Tab": Move to the previous cell.
 *
 * 4. floating menu:
 *      - create a floating toolbar to handle table actions.
 */
export const tablePlugins = () => {
    return [
        columnResizing(),
        tableEditing(),
        keymap({
            Tab: goToNextCell(1),
            "Shift-Tab": goToNextCell(-1),
        }),
        floatingTableToolbarPlugin(),
    ];
};
