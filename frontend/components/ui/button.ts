import crelt from "crelt";
import { EditorView } from "prosemirror-view";
import { EditorState, Transaction } from "prosemirror-state";
import { icons } from "@/plugins/icons";
import { createSVG } from "@/utils/svg";
import { translate } from "@/i18n/translations";

export interface ButtonOptions {
    class?: string;
    title?: string;
    icon?: keyof typeof icons;
    onClick?: (e: MouseEvent) => void;
    disabled?: boolean;
}

export interface ToolbarButtonOptions extends ButtonOptions {
    command?: (
        state: EditorState,
        dispatch?: (tr: Transaction) => void,
    ) => boolean;
    isActive?: (state: EditorState) => boolean;
}

const prefix = "table-toolbar";

export function createButton(options: ButtonOptions): HTMLButtonElement {
    const buttonEl = crelt("button", {
        class: options.class || `${prefix}__button`,
        type: "button",
        title: options.title ? translate(options.title) : undefined,
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
        buttonEl.classList.add(`${prefix}__button--disabled`);
    }

    return buttonEl;
}

export function createToolbarButton(
    options: ToolbarButtonOptions,
    view: EditorView,
): HTMLButtonElement {
    const buttonEl = createButton({
        ...options,
        onClick: options.command
            ? () => {
                  if (options.command!(view.state, view.dispatch)) {
                      view.focus();
                  }
              }
            : options.onClick,
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

    buttonEl.classList.toggle(`${prefix}__button--disabled`, !isEnabled);
    buttonEl.classList.toggle(`${prefix}__button--active`, active);
    buttonEl.disabled = !isEnabled;
}
