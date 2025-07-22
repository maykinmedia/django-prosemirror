import { EditorView } from "prosemirror-view";
import { isInTable } from "prosemirror-tables";
import { TableElementData, ToolbarPosition } from "../types";

export function getTableElement(view: EditorView): Element | null {
    const { selection } = view.state;
    const { $anchor } = selection;

    // Find the table node in the document
    for (let i = $anchor.depth; i > 0; i--) {
        const node = $anchor.node(i);
        if (node.type.name === "table") {
            const tableStart = $anchor.start(i);
            const tablePos = view.domAtPos(tableStart);

            if (tablePos.node) {
                let element: Node | null = tablePos.node;

                // Traverse up to find the table element
                while (element && element.nodeType !== Node.ELEMENT_NODE) {
                    element = element.parentNode;
                }

                // Keep looking up until we find the actual table element
                while (element && element.nodeType === Node.ELEMENT_NODE) {
                    if (
                        (element as Element).tagName?.toLowerCase() === "table"
                    ) {
                        return element as Element;
                    }
                    element = element.parentNode;
                }
            }
        }
    }
    return null;
}

export function isInsideTable(view: EditorView): boolean {
    // @ts-expect-error prop is available but not in this.view
    if (!view.focused) return false;
    return isInTable(view.state);
}

export function calculateToolbarPosition(
    tableElement: Element,
    toolbarElement: HTMLElement,
): ToolbarPosition {
    const tableWrapper = tableElement.parentElement;
    if (!tableWrapper) {
        return { top: 0, left: 0 };
    }

    const wrapperRect = tableWrapper.getBoundingClientRect();
    const tableRect = tableElement.getBoundingClientRect();
    const toolbarRect = toolbarElement.getBoundingClientRect();
    const spacing = 8;

    // Position the toolbar 8px below the table, centered horizontally
    const top = tableRect.top - toolbarRect.height - spacing;
    const left =
        wrapperRect.left +
        (Math.min(wrapperRect?.width, tableRect.width) - toolbarRect.width) / 2;

    // Apply position with scroll offset
    return {
        top: top + window.scrollY,
        left: left + window.scrollX,
    };
}

export function getTableElementData(view: EditorView): TableElementData | null {
    const tableElement = getTableElement(view);
    const tableWrapper = tableElement?.parentElement;

    if (!tableElement || !tableWrapper) {
        return null;
    }

    return { tableElement, tableWrapper };
}
