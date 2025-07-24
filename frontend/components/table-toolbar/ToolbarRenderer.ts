import {
    ButtonComponent,
    // createDeleteButtonConfig,
    DropdownComponent,
    setupDocumentClickHandler,
} from "@/components/table-toolbar";
// import { dynamic_seperator } from "@/components/table-toolbar/components";
import crelt from "crelt";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { dynamic_seperator } from "./separator";
import { classes, translate } from "@/conf";
import { createDropdownConfigs } from "./config/dropdowns";
import { deleteTable } from "prosemirror-tables";

/**
 * Class that renders the toolbar with the dropdowns and delete button.
 * Also used to update the dropdown states.
 */

export class ToolbarRenderer {
    private dom: HTMLElement;
    private view: EditorView;
    private dropdownComponents: DropdownComponent[] = [];
    private deleteButtonComponent: ButtonComponent | null = null;
    private dropdownElements: HTMLElement[] = [];
    // private buttonElement: HTMLButtonElement | null = null;

    constructor(view: EditorView) {
        this.view = view;
        this.dom = crelt("div", {
            class: classes.TABLE_TOOLBAR,
        });
    }

    render(
        onHide: () => void,
        onShow: () => void,
        onPosition: () => void,
        isInsideTable: () => boolean,
    ): HTMLElement {
        // Create dropdown components
        this.dropdownComponents = createDropdownConfigs().map(
            (dropdown) => new DropdownComponent(dropdown, this.view),
        );
        this.deleteButtonComponent = new ButtonComponent(
            {
                icon: "deleteTable",
                title: translate("Delete table"),
                command: deleteTable,
            },
            this.view,
        );
        this.dropdownElements = [];

        // Create all elements
        this.dropdownComponents.forEach((component) => {
            const dropdownEl = component.createDropdown();
            this.dropdownElements.push(dropdownEl);

            // Add a seperator after each dropdown.
            crelt(this.dom, dropdownEl, dynamic_seperator());
        });

        // this.buttonElement = this.deleteButtonComponent.element;
        crelt(this.dom, this.deleteButtonComponent.element);

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
        if (this.deleteButtonComponent)
            this.deleteButtonComponent.updateButtonState(state);
    }

    getDom(): HTMLElement {
        return this.dom;
    }
}
