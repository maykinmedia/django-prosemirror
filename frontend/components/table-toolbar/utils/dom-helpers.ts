import { EditorView } from "prosemirror-view";
import { TABLE_TOOLBAR_PREFIX } from "../../../conf/constants";

/**
 * Close all dropdowns except one dropdown
 * @param container Container containing the dropdowns
 * @param except The excepted dropdown
 */
export function closeDropdowns(
    container: HTMLElement,
    except?: HTMLElement,
): void {
    container
        .querySelectorAll(".table-toolbar__dropdown--open")
        .forEach((el) => {
            if (el !== except)
                el.classList.remove("table-toolbar__dropdown--open");
        });
}

/**
 * ## Global click event handler to manage multiple click events at once.
 *
 * 1. Close all dropdowns except the current one to open (if defined).
 * 2. Hide the table toolbar if the current focus is outside a table.
 *
 * @param container The table toolbar container.
 * @param view Current EditorView
 * @param onHide Callback to hide the toolbar
 * @param onShow Callback to show the toolbar
 * @param onPosition Callback to reposition the toolbar
 * @param isInsideTable Callback that returns true if the current focus is inside the table.
 */
export function setupDocumentClickHandler(
    container: HTMLElement,
    view: EditorView,
    onHide: VoidFunction,
    onShow: VoidFunction,
    onPosition: VoidFunction,
    isInsideTable: () => boolean,
): void {
    document.addEventListener("click", (e) => {
        const target = e.target as Node;
        // Close dropdowns when clicking outside
        if (!container.contains(target)) {
            closeDropdowns(container);
        }

        // Close table dropdown if focus changes to anything different than the current editor or table toolbar.
        if (!container.contains(target) && !view.dom.contains(target)) {
            onHide();
        } else if (isInsideTable()) {
            onShow();
            onPosition();
        }
    });
}

export function prefixedClassname(className: string) {
    return `${TABLE_TOOLBAR_PREFIX}${className}`;
}
