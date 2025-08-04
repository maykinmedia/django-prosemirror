import { MenuItem } from "prosemirror-menu";
import { icons } from "../icons";
import { Attrs, Fragment } from "prosemirror-model";
import { translate } from "@/i18n/translations";
import { canInsert } from "./utils";
import { TablePrompt } from "@/plugins/prompt-plugin";

export interface TableMenuOptions {
    widgetRows: number;
    widgetColumns: number;
}

// TODO some parts of the callback, should be implemented in the tablefield clean function.
export const buildTableMenuItem = (): MenuItem => {
    return new MenuItem({
        title: "Insert table",
        label: "table",
        icon: icons.table,
        enable: (state) => canInsert(state, state.schema.nodes.table),
        run: (state, dispatch, view) => {
            // Open dialog for table properties
            new TablePrompt({
                title: translate("Insert table"),
                dom: view.dom,
                callback: (attrs: Attrs) => {
                    // Validate schema support for table nodes
                    const missingNodes = [
                        "table",
                        "table_row",
                        "table_header",
                        "table_cell",
                    ].filter((node) => !state.schema.nodes[node]);
                    if (missingNodes.length > 0) {
                        console.error(
                            `Missing required schema nodes: ${missingNodes.join(", ")}`,
                        );
                        return;
                    }
                    // Parse the size string to get rows and columns
                    // attrs.size is in format '[3, 3]' - parse to get [rows, cols]
                    const sizeMatch = attrs.size.match(/\[(\d+),\s*(\d+)\]/);
                    if (!sizeMatch) {
                        console.error("Invalid size format:", attrs.size);
                        return;
                    }
                    const rowCount = parseInt(sizeMatch[1], 10) + 1; // +1 because array is 0-indexed
                    const colCount = parseInt(sizeMatch[2], 10) + 1; // +1 because array is 0-indexed
                    // Validate reasonable dimensions
                    if (
                        rowCount <= 0 ||
                        colCount <= 0 ||
                        rowCount > 8 ||
                        colCount > 8
                    ) {
                        console.error(
                            `Invalid table dimensions: ${rowCount}x${colCount}`,
                        );
                        return;
                    }
                    try {
                        // Create table rows dynamically
                        const tableRows = [];
                        for (let row = 0; row < rowCount; row++) {
                            const isHeaderRow = row === 0;
                            const cells = [];
                            // Create cells for this row
                            for (let col = 0; col < colCount; col++) {
                                const nodeType = isHeaderRow
                                    ? state.schema.nodes.table_header
                                    : state.schema.nodes.table_cell;
                                const cell = nodeType.createAndFill();
                                if (!cell) {
                                    throw new Error(
                                        `Failed to create ${isHeaderRow ? "header" : "cell"} at position [${row}, ${col}]`,
                                    );
                                }
                                cells.push(cell);
                            }
                            // Create the row with all its cells
                            const tableRow =
                                state.schema.nodes.table_row.create(
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
                        // Insert table and focus
                        dispatch(state.tr.replaceSelectionWith(table));
                        view.focus();
                    } catch (error) {
                        console.error("Failed to create table:", error);
                        return;
                    }
                },
                hideButtons: true,
            });
        },
    });
};
