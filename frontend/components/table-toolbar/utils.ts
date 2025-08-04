import { EditorView } from "prosemirror-view";
import {
    isInTable,
    columnIsHeader,
    rowIsHeader,
    selectedRect,
} from "prosemirror-tables";

export function isHeaderRowActive(view: EditorView): boolean {
    if (!isInsideTable(view)) return false;
    const tableRect = selectedRect(view.state);
    return rowIsHeader(tableRect.map, tableRect.table, tableRect.top);
}

export function isHeaderColumnActive(view: EditorView): boolean {
    if (!isInsideTable(view)) return false;
    const tableRect = selectedRect(view.state);
    return columnIsHeader(tableRect.map, tableRect.table, tableRect.left);
}

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
