import { MenuItem } from "prosemirror-menu";
// import { canInsert } from "prosemirror-utils";
import { icons } from "../icons";
import { Fragment } from "prosemirror-model";
import { TableField, openPrompt } from "./prompt";
import { translate } from "@/i18n/translations";
import { canInsert } from "./utils";

export interface TableMenuOptions {
    widgetRows: number;
    widgetColumns: number;
}

export const buildTableMenuItem = (): MenuItem => {
    return new MenuItem({
        title: "Insert table",
        label: "table",
        icon: icons.table,
        enable: (state) => canInsert(state, state.schema.nodes.table),
        run: (state, dispatch, view) => {
            // Open dialog for table properties
            openPrompt({
                title: translate("Insert table"),
                fields: {
                    size: new TableField({
                        label: "Size",
                    }),
                },
                dom: view.dom,
                callback: (attrs) => {
                    // Parse the size string to get rows and columns
                    // attrs.size is in format '[3, 3]' - parse to get [rows, cols]
                    const sizeMatch = attrs.size.match(/\[(\d+),\s*(\d+)\]/);
                    if (!sizeMatch) {
                        console.error("Invalid size format:", attrs.size);
                        return;
                    }

                    const rows = parseInt(sizeMatch[1], 10) + 1; // +1 because array is 0-indexed
                    const cols = parseInt(sizeMatch[2], 10) + 1; // +1 because array is 0-indexed

                    // Create table rows dynamically
                    const tableRows = [];

                    for (let row = 0; row < rows; row++) {
                        // Create cells for this row
                        const cells = [];
                        for (let col = 0; col < cols; col++) {
                            const cell =
                                row !== 0
                                    ? state.schema.nodes.table_cell.createAndFill()!
                                    : state.schema.nodes.table_header.createAndFill()!;
                            cells.push(cell);
                        }

                        // Create the row with all its cells
                        const tableRow = state.schema.nodes.table_row.create(
                            undefined,
                            Fragment.fromArray(cells),
                        );

                        tableRows.push(tableRow);
                    }

                    // Create the table with all rows
                    const table = state.schema.nodes.table.create(
                        undefined,
                        Fragment.fromArray(tableRows),
                    );

                    // Insert the table
                    dispatch(state.tr.replaceSelectionWith(table));

                    view.focus();
                },
                hideButtons: true,
            });
        },
    });
};
