import { EditorView } from "prosemirror-view";
import { EditorState, Transaction } from "prosemirror-state";
import { prefixedClassname } from "./utils/dom-helpers";
import { createSVG } from "./svg";
import crelt from "crelt";
import { icons } from "@/plugins/icons";

export interface ButtonOptions {
    class?: string;
    title?: string;
    icon?: keyof typeof icons;
    onClick?: (e: MouseEvent) => void;
    disabled?: boolean;
    command?: (
        state: EditorState,
        dispatch?: (tr: Transaction) => void,
    ) => boolean;
    isActive?: (state: EditorState) => boolean;
}

export class ButtonComponent {
    private options: ButtonOptions;
    private view: EditorView;
    element: HTMLButtonElement;

    constructor(options: ButtonOptions, view: EditorView) {
        this.options = options;
        this.view = view;
        this.element = this.createButton();
    }

    createButton(): HTMLButtonElement {
        this.options.onClick = () => {
            if (this.options.command?.(this.view.state, this.view.dispatch)) {
                this.view.focus();
            }
        };
        const buttonEl = this.createButtonBase();

        return buttonEl;
    }

    createButtonBase(): HTMLButtonElement {
        const buttonEl = crelt("button", {
            class: this.options.class || prefixedClassname("__button"),
            type: "button",
            title: this.options.title,
        }) as HTMLButtonElement;

        if (this.options.icon && icons[this.options.icon]) {
            crelt(buttonEl, createSVG(icons[this.options.icon]));
        }

        if (this.options.onClick) {
            buttonEl.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.options.onClick!(e);
            });
        }

        if (this.options.disabled) {
            buttonEl.disabled = true;
            buttonEl.classList.add(prefixedClassname("__button--disabled"));
        }

        return buttonEl;
    }

    updateButtonState(state: EditorState): void {
        const isEnabled = this.options.command
            ? this.options.command(state)
            : true;

        const active = this.options.isActive
            ? this.options.isActive(state)
            : false;

        this.element.classList.toggle(
            prefixedClassname("__button--disabled"),
            !isEnabled,
        );
        this.element.classList.toggle(
            prefixedClassname("__button--active"),
            active,
        );
        this.element.disabled = !isEnabled;
    }
}
