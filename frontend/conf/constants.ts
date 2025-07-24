import BEM from "bem.js";

BEM.addModifier(document.createElement("div"), "test");

export const TABLE_TOOLBAR_PREFIX = "table-toolbar";
export const TABLE_TOOLBAR = "table-toolbar";

export const TABLE_TOOLBAR_DROPDOWN = "table-toolbar__dropdown";

export const expectedClasses = {
    container: "table-toolbar",

    dropdown: "table-toolbar__dropdown",
    dropdownOpen: "table-toolbar__dropdown--open",

    dropdownMenu: "table-toolbar__dropdown-menu",

    dropdownItem: "table-toolbar__dropdown-item",
    dropdownItemActive: "table-toolbar__dropdown-item--active",
    dropdownItemDisabled: "table-toolbar__dropdown-item--disabled",

    button: "table-toolbar__button",
    buttonActive: "table-toolbar__button--active",
    buttonDisabled: "table-toolbar__button--disabled",

    dropdownButton: "table-toolbar__dropdown-button",
    dropdownButtonActive: "table-toolbar__button--active",
    dropdownButtonDisabled: "table-toolbar__button--disabled",
};

// Generated with BEM
export const TABLE_TOOLBAR_DROPDOWN_ITEM = BEM.getBEMClassName(
    TABLE_TOOLBAR_PREFIX,
    "dropdown-item",
);
export const TABLE_TOOLBAR_DROPDOWN_ITEM_ACTIVE = BEM.getBEMClassName(
    TABLE_TOOLBAR_PREFIX,
    "dropdown-item",
    "active",
);
export const TABLE_TOOLBAR_DROPDOWN_ITEM_DISABLED = BEM.getBEMClassName(
    TABLE_TOOLBAR_PREFIX,
    "dropdown-item",
    "disabled",
);

export const TABLE_TOOLBAR_DROPDOWN_MENU = BEM.getBEMClassName(
    TABLE_TOOLBAR_PREFIX,
    "dropdown-menu",
);

export const TABLE_TOOLBAR_DROPDOWN_OPEN = BEM.getBEMClassName(
    TABLE_TOOLBAR_PREFIX,
    "dropdown",
    "open",
);

export const TABLE_TOOLBAR_BUTTON = BEM.getBEMClassName(
    TABLE_TOOLBAR_PREFIX,
    "button",
);
export const TABLE_TOOLBAR_BUTTON_ACTIVE = BEM.getBEMClassName(
    TABLE_TOOLBAR_PREFIX,
    "button",
    "active",
);
export const TABLE_TOOLBAR_BUTTON_DISABLED = BEM.getBEMClassName(
    TABLE_TOOLBAR_PREFIX,
    "button",
    "disabled",
);

export const TABLE_TOOLBAR_DROPDOWN_BUTTON = BEM.getBEMClassName(
    TABLE_TOOLBAR_PREFIX,
    "dropdown-button",
);
export const TABLE_TOOLBAR_DROPDOWN_BUTTON_ACTIVE = TABLE_TOOLBAR_BUTTON_ACTIVE;
export const TABLE_TOOLBAR_DROPDOWN_BUTTON_DISABLED =
    TABLE_TOOLBAR_BUTTON_DISABLED;

export const classes = Object.freeze({
    TABLE_TOOLBAR,
    TABLE_TOOLBAR_DROPDOWN_ITEM,
    TABLE_TOOLBAR_DROPDOWN_ITEM_ACTIVE,
    TABLE_TOOLBAR_DROPDOWN_ITEM_DISABLED,
    TABLE_TOOLBAR_DROPDOWN_MENU,
    TABLE_TOOLBAR_DROPDOWN_OPEN,
    TABLE_TOOLBAR_BUTTON,
    TABLE_TOOLBAR_BUTTON_ACTIVE,
    TABLE_TOOLBAR_BUTTON_DISABLED,
    TABLE_TOOLBAR_DROPDOWN_BUTTON,
    TABLE_TOOLBAR_DROPDOWN_BUTTON_ACTIVE,
    TABLE_TOOLBAR_DROPDOWN_BUTTON_DISABLED,
});
