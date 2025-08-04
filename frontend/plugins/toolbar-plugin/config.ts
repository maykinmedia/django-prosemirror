import { EditorView } from "prosemirror-view";
import { MenuItem } from "./types";
import { uploadImage } from "@/plugins/image-upload-plugin";

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

export const createMenuItems = (linkUrl?: string): MenuItem[] => {
    const menuItems: MenuItem[] = [];

    // 1. Open link to '/change-image/${link-url}'
    if (linkUrl) {
        menuItems.push({
            id: "open-change-link",
            type: "link",
            label: "Edit",
            icon: "link",
            title: "Open edit page",
            href: `/change-image/${linkUrl}`,
            target: "_blank",
        });
    }

    // Add separator if we have both items
    if (linkUrl) {
        menuItems.push({
            id: "separator-1",
            type: "separator",
            label: "",
        });
    }

    // 2. Change image - file input
    menuItems.push({
        id: "change-image-file",
        type: "button",
        label: "File",
        icon: "image",
        title: "Replace image file",
        action: (view: EditorView) => {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";
            fileInput.style.display = "none";

            fileInput.onchange = (e) => {
                const inputTarget = e.target as HTMLInputElement;
                const files = inputTarget.files;
                if (files && files.length > 0) {
                    const file = files[0];

                    uploadImage(file, { src: URL.createObjectURL(file) }).then(
                        (attrs) => {
                            const tr = view.state.tr.setNodeMarkup(
                                view.state.selection.from,
                                undefined,
                                attrs,
                            );
                            view.dispatch(tr);
                            view.focus();
                        },
                    );
                }
                document.body.removeChild(fileInput);
            };

            fileInput.oncancel = () => {
                document.body.removeChild(fileInput);
            };

            document.body.appendChild(fileInput);
            fileInput.click();
        },
    });

    return menuItems;
};
