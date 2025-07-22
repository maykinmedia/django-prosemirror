import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { createToolbarButton, updateButtonState } from "@/components/ui";
import { FloatingTableToolbarButton } from "../types";

export class ButtonComponent {
    private button: FloatingTableToolbarButton;
    private view: EditorView;

    constructor(button: FloatingTableToolbarButton, view: EditorView) {
        this.button = button;
        this.view = view;
    }

    createButton(): HTMLButtonElement {
        return createToolbarButton(
            {
                title: this.button.title,
                icon: this.button.icon,
                command: this.button.command,
            },
            this.view,
        );
    }

    updateButtonState(buttonEl: HTMLButtonElement, state: EditorState): void {
        updateButtonState(
            buttonEl,
            state,
            this.button.command,
            this.button.isActive,
        );
    }
}
