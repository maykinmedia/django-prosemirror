import {
    isHeaderColumnActive,
    isHeaderRowActive,
    TableToolbarButton,
    TableToolbarDropdown,
} from "@/components";
import { translate } from "@/conf";
import {
    addColumnAfter,
    addColumnBefore,
    addRowAfter,
    addRowBefore,
    deleteColumn,
    deleteRow,
    deleteTable,
    mergeCells,
    splitCell,
    toggleHeaderColumn,
    toggleHeaderRow,
} from "prosemirror-tables";

export function createDeleteButtonConfig(): TableToolbarButton {
    return {
        icon: "deleteTable",
        title: translate("Delete table"),
        command: deleteTable,
    };
}

export function createDropdownConfigs(): TableToolbarDropdown[] {
    return [
        {
            icon: "rowDropdown",
            title: translate("Row operations"),
            items: [
                {
                    icon: "addRowBefore",
                    title: translate("Add row before"),
                    command: addRowBefore,
                },
                {
                    icon: "addRowAfter",
                    title: translate("Add row after"),
                    command: addRowAfter,
                },
                {
                    icon: "deleteRow",
                    title: translate("Delete row"),
                    command: deleteRow,
                },
                {
                    icon: "headerRow",
                    title: translate("Toggle header row"),
                    command: toggleHeaderRow,
                    isActive: isHeaderRowActive,
                },
            ],
        },
        {
            icon: "columnDropdown",
            title: translate("Column operations"),
            items: [
                {
                    icon: "addColumnBefore",
                    title: translate("Add column before"),
                    command: addColumnBefore,
                },
                {
                    icon: "addColumnAfter",
                    title: translate("Add column after"),
                    command: addColumnAfter,
                },
                {
                    icon: "deleteColumn",
                    title: translate("Delete column"),
                    command: deleteColumn,
                },
                {
                    icon: "headerColumn",
                    title: translate("Toggle header column"),
                    command: toggleHeaderColumn,
                    isActive: isHeaderColumnActive,
                },
            ],
        },
        {
            icon: "cellDropdown",
            title: translate("Cell operations"),
            items: [
                {
                    icon: "mergeCells",
                    title: translate("Merge cells"),
                    command: mergeCells,
                },
                {
                    icon: "splitCell",
                    title: translate("Split cell"),
                    command: splitCell,
                },
            ],
        },
    ];
}
