import crelt from "crelt";
import { EditorView } from "prosemirror-view";
import { EditorState, Transaction } from "prosemirror-state";
import { icons } from "@/plugins/icons";
import { createButton } from "./button";

export interface DropdownItem {
    title: string;
    command: (
        state: EditorState,
        dispatch?: (tr: Transaction) => void,
    ) => boolean;
    isActive?: (state: EditorState) => boolean;
}

export interface DropdownOptions {
    title: string;
    icon?: keyof typeof icons;
    items: DropdownItem[];
    class?: string;
    onClose?: () => void;
}

const prefix = "table-toolbar";

export function createDropdown(
    options: DropdownOptions,
    view: EditorView,
): HTMLElement {
    const buttonEl = createButton({
        class: `${options.class || `${prefix}__button`} ${prefix}__dropdown-button`,
        title: options.title,
        icon: options.icon,
    });

    const menuEl = crelt(
        "div",
        {
            class: `${prefix}__dropdown-menu`,
        },
        ...options.items.map((item) => {
            const itemEl = crelt(
                "div",
                {
                    class: `${prefix}__dropdown-item`,
                },
                item.title,
            );

            itemEl.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (item.command(view.state, view.dispatch)) {
                    view.focus();
                }
                dropdownEl.classList.remove(`${prefix}__dropdown--open`);
                if (options.onClose) {
                    options.onClose();
                }
            });

            return itemEl;
        }),
    );

    const dropdownEl = crelt(
        "div",
        {
            class: `${prefix}__dropdown`,
            "data-dropdown": options.title,
        },
        buttonEl,
        menuEl,
    );

    buttonEl.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Close all other dropdowns
        const container = dropdownEl.closest(`.${prefix}`) as HTMLElement;
        if (container) {
            closeDropdowns(container, dropdownEl);
        }

        // Toggle this dropdown
        dropdownEl.classList.toggle(`${prefix}__dropdown--open`);
    });

    return dropdownEl;
}

export function updateDropdownItemStates(
    dropdownEl: HTMLElement,
    state: EditorState,
    items: DropdownItem[],
): void {
    items.forEach((item) => {
        const menuEl = dropdownEl.querySelector(`.${prefix}__dropdown-menu`);
        if (menuEl) {
            const itemEl = Array.from(menuEl.children).find((child) =>
                child.textContent?.includes(item.title),
            ) as HTMLElement;

            if (itemEl) {
                const isEnabled = item.command(state);
                const isActive = item.isActive ? item.isActive(state) : false;

                itemEl.classList.toggle(
                    `${prefix}__dropdown-item--disabled`,
                    !isEnabled,
                );
                itemEl.classList.toggle(
                    `${prefix}__dropdown-item--active`,
                    isActive,
                );
            }
        }
    });
}

function closeDropdowns(
    container: HTMLElement,
    exceptDropdown?: HTMLElement,
): void {
    const dropdowns = container.querySelectorAll(`.${prefix}__dropdown--open`);
    dropdowns.forEach((dropdown) => {
        if (dropdown !== exceptDropdown) {
            dropdown.classList.remove(`${prefix}__dropdown--open`);
        }
    });
}
