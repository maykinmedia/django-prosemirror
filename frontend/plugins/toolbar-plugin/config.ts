/**
 * CSS class names for toolbar components
 */
export const TOOLBAR_CLS = {
    toolbar: "generic-toolbar",
    toolbar__visible: "generic-toolbar--visible",

    button: "generic-toolbar__button",
    button__active: "generic-toolbar__button--active",
    button__disabled: "generic-toolbar__button--disabled",

    link: "generic-toolbar__link",
    link__active: "generic-toolbar__link--active",
    link__disabled: "generic-toolbar__link--disabled",

    separator: "generic-toolbar__separator",

    dropdown: "generic-toolbar__dropdown",
    dropdown__open: "generic-toolbar__dropdown--open",
    dropdown_button: "generic-toolbar__dropdown-button",
    dropdown_menu: "generic-toolbar__dropdown-menu",
    dropdown_item: "generic-toolbar__dropdown-item",
    dropdown_item__active: "generic-toolbar__dropdown-item--active",
    dropdown_item__disabled: "generic-toolbar__dropdown-item--disabled",
} as const;
