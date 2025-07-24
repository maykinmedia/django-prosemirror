import { icons } from "@/plugins/icons";
import { createSVG } from "@/components/table-toolbar/svg";
import crelt from "crelt";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { prefixedClassname } from ".";

export interface ButtonOptions {
    class?: string;
    title?: string;
    icon?: keyof typeof icons;
    onClick?: (e: MouseEvent) => void;
    disabled?: boolean;
}
export interface ToolbarButtonOptions extends Omit<ButtonOptions, "onClick"> {
    command: (
        state: EditorState,
        dispatch?: (tr: Transaction) => void,
    ) => boolean;
    isActive?: (state: EditorState) => boolean;
}

export function createButton(options: ButtonOptions): HTMLButtonElement {
    const buttonEl = crelt("button", {
        class: options.class || prefixedClassname("__button"),
        type: "button",
        title: options.title,
    }) as HTMLButtonElement;

    if (options.icon && icons[options.icon]) {
        crelt(buttonEl, createSVG(icons[options.icon]));
    }

    if (options.onClick) {
        buttonEl.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            options.onClick!(e);
        });
    }

    if (options.disabled) {
        buttonEl.disabled = true;
        buttonEl.classList.add(prefixedClassname("__button--disabled"));
    }

    return buttonEl;
}

export function createToolbarButton(
    options: ToolbarButtonOptions,
    view: EditorView,
): HTMLButtonElement {
    const buttonEl = createButton({
        ...options,
        onClick: () => {
            if (options.command(view.state, view.dispatch)) {
                view.focus();
            }
        },
    });

    return buttonEl;
}

export function updateButtonState(
    buttonEl: HTMLButtonElement,
    state: EditorState,
    command?: (
        state: EditorState,
        dispatch?: (tr: Transaction) => void,
    ) => boolean,
    isActive?: (state: EditorState) => boolean,
): void {
    const isEnabled = command ? command(state) : true;
    const active = isActive ? isActive(state) : false;

    buttonEl.classList.toggle(
        prefixedClassname("__button--disabled"),
        !isEnabled,
    );
    buttonEl.classList.toggle(prefixedClassname("__button--active"), active);
    buttonEl.disabled = !isEnabled;
}
