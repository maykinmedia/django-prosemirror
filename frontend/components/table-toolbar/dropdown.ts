import crelt from "crelt";
import { EditorView } from "prosemirror-view";
import { EditorState, Transaction } from "prosemirror-state";
import { icons } from "@/plugins/icons";
// import { createButton } from "./button";
import { TABLE_TOOLBAR_PREFIX } from "@/conf";
import { ButtonComponent } from "./ButtonComponent";
// import { createButton } from "./button";

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
}

export function createDropdown(
    options: DropdownOptions,
    view: EditorView,
): HTMLElement {
    const btn = new ButtonComponent(
        {
            class: `${TABLE_TOOLBAR_PREFIX}__button ${TABLE_TOOLBAR_PREFIX}__dropdown-button`,
            title: options.title,
            icon: options.icon,
        },
        view,
    );

    const menuEl = crelt("div", {
        class: `${TABLE_TOOLBAR_PREFIX}__dropdown-menu`,
    });

    const itemsEl = options.items.map((item) => {
        const itemEl = crelt(
            "div",
            {
                class: `${TABLE_TOOLBAR_PREFIX}__dropdown-item`,
            },
            item.title,
        );

        itemEl.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (item.command(view.state, view.dispatch)) {
                view.focus();
            }
            dropdownEl.classList.remove(
                `${TABLE_TOOLBAR_PREFIX}__dropdown--open`,
            );
        });

        return itemEl;
    });

    crelt(menuEl, ...itemsEl);

    const dropdownEl = crelt(
        "div",
        {
            class: `${TABLE_TOOLBAR_PREFIX}__dropdown`,
            "data-dropdown": options.title,
        },
        btn.element,
        menuEl,
    );

    btn.element.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Close all other dropdowns
        const container = dropdownEl.closest(
            `.${TABLE_TOOLBAR_PREFIX}`,
        ) as HTMLElement;
        if (container) {
            closeDropdowns(container, dropdownEl);
        }

        // Toggle this dropdown
        dropdownEl.classList.toggle(`${TABLE_TOOLBAR_PREFIX}__dropdown--open`);
    });

    return dropdownEl;
}

export function updateDropdownItemStates(
    dropdownEl: HTMLElement,
    state: EditorState,
    items: DropdownItem[],
): void {
    items.forEach((item) => {
        const menuEl = dropdownEl.querySelector(
            `.${TABLE_TOOLBAR_PREFIX}__dropdown-menu`,
        );
        if (menuEl) {
            const itemEl = Array.from(menuEl.children).find((child) =>
                child.textContent?.includes(item.title),
            ) as HTMLElement;

            if (itemEl) {
                const isEnabled = item.command(state);
                const isActive = item.isActive ? item.isActive(state) : false;

                itemEl.classList.toggle(
                    `${TABLE_TOOLBAR_PREFIX}__dropdown-item--disabled`,
                    !isEnabled,
                );
                itemEl.classList.toggle(
                    `${TABLE_TOOLBAR_PREFIX}__dropdown-item--active`,
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
    const dropdowns = container.querySelectorAll(
        `.${TABLE_TOOLBAR_PREFIX}__dropdown--open`,
    );
    dropdowns.forEach((dropdown) => {
        if (dropdown !== exceptDropdown) {
            dropdown.classList.remove(
                `${TABLE_TOOLBAR_PREFIX}__dropdown--open`,
            );
        }
    });
}
