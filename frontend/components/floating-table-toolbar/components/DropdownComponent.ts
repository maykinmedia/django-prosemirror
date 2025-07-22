import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { createDropdown, updateDropdownItemStates } from "@/components/ui";
import { FloatingTableToolbarDropdown } from "@/components/floating-table-toolbar";

/**
 * Create the dropdown component and link it to a view.
 */
export class DropdownComponent {
    private dropdown: FloatingTableToolbarDropdown;
    private view: EditorView;

    constructor(dropdown: FloatingTableToolbarDropdown, view: EditorView) {
        this.dropdown = dropdown;
        this.view = view;
    }

    createDropdown(): HTMLElement {
        return createDropdown(
            {
                title: this.dropdown.title,
                icon: this.dropdown.icon,
                items: this.dropdown.items,
            },
            this.view,
        );
    }

    updateDropdownStates(dropdownEl: HTMLElement, state: EditorState): void {
        updateDropdownItemStates(dropdownEl, state, this.dropdown.items);
    }
}
