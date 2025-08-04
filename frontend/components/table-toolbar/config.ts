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
import { translate } from "@/i18n/translations";
import {
    isHeaderRowActive,
    isHeaderColumnActive,
    ButtonOrDropdown,
} from "@/components/table-toolbar";

export const tableToolbarMenuConfig: ButtonOrDropdown[] = [
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
    {
        icon: "deleteTable",
        title: translate("Delete table"),
        command: deleteTable,
    },
];

export const TABLE_TOOLBAR_CLS = {
    toolbar: "table-toolbar",
    toolbar__visible: "table-toolbar--visible",
    // Separator
    separator: "table-toolbar__separator",

    // Button
    button: "table-toolbar__button",
    button__disabled: "table-toolbar__button--disabled",
    button__active: "table-toolbar__button--active",

    // Dropdown
    dropdown: "table-toolbar__dropdown",
    dropdown__open: "table-toolbar__dropdown--open",

    // Menu
    dropdown_menu: "table-toolbar__dropdown-menu",

    // Button
    dropdown_button: "table-toolbar__dropdown-button",

    // Item
    dropdown_item: "table-toolbar__dropdown-item",
    dropdown_item__disabled: "table-toolbar__dropdown-item--disabled",
    dropdown_item__active: "table-toolbar__dropdown-item--active",
} as const;
