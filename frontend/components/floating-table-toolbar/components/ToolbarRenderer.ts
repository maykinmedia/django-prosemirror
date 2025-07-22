import {
    ButtonComponent,
    DropdownComponent,
    FloatingTableToolbarButton,
    FloatingTableToolbarDropdown,
    setupDocumentClickHandler,
} from "@/components/floating-table-toolbar";
import { dynamic_seperator } from "@/components/ui";
import crelt from "crelt";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

/**
 * Class that renders the toolbar with the dropdowns and delete button.
 * Also used to update the dropdown states.
 */
export class ToolbarRenderer {
    private dom: HTMLElement;
    private view: EditorView;
    private dropdownComponents: DropdownComponent[] = [];
    private buttonComponent: ButtonComponent | null = null;
    private dropdownElements: HTMLElement[] = [];
    private buttonElement: HTMLButtonElement | null = null;

    constructor(view: EditorView) {
        this.view = view;
        this.dom = crelt("div", {
            class: "table-toolbar",
        });
    }

    render(
        dropdowns: FloatingTableToolbarDropdown[],
        deleteButton: FloatingTableToolbarButton,
        onHide: () => void,
        onShow: () => void,
        onPosition: () => void,
        isInsideTable: () => boolean,
    ): HTMLElement {
        this.dom.innerHTML = "";

        // Create dropdown components
        this.dropdownComponents = dropdowns.map(
            (dropdown) => new DropdownComponent(dropdown, this.view),
        );
        this.buttonComponent = new ButtonComponent(deleteButton, this.view);
        this.dropdownElements = [];

        // Create all elements
        this.dropdownComponents.forEach((component) => {
            const dropdownEl = component.createDropdown();
            this.dropdownElements.push(dropdownEl);

            // Add a seperator after each dropdown.
            crelt(this.dom, dropdownEl, dynamic_seperator());
        });

        this.buttonElement = this.buttonComponent.createButton();
        crelt(this.dom, this.buttonElement);

        // Append button element to the dom.

        // Setup document click handler
        setupDocumentClickHandler(
            this.dom,
            this.view,
            onHide,
            onShow,
            onPosition,
            isInsideTable,
        );

        return this.dom;
    }

    updateStates(state: EditorState): void {
        // Update dropdown states
        this.dropdownComponents.forEach((component, index) => {
            component.updateDropdownStates(this.dropdownElements[index], state);
        });

        // Update button state
        if (this.buttonElement && this.buttonComponent) {
            this.buttonComponent.updateButtonState(this.buttonElement, state);
        }
    }

    getDom(): HTMLElement {
        return this.dom;
    }
}
