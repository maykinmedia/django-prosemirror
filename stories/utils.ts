import { MarkType, NodeType } from "@/schema/types";
import type { ProseMirrorDoc, ProseMirrorNode } from "@/types/types";
import { Attrs } from "prosemirror-model";
import { expect } from "storybook/test";

// Helper functions for interaction tests
export const waitForEditor = async (canvasElement: HTMLElement) => {
    const canvas = canvasElement.querySelector(
        '[data-prosemirror-id="storybook-prosemirror-editor"]',
    );
    if (!canvas) throw new Error("Canvas element not found");

    // Wait for the ProseMirror editor to be initialized
    let editor = canvas.querySelector(".ProseMirror");
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds with 100ms intervals

    while (!editor && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        editor = canvas.querySelector(".ProseMirror");
        attempts++;
    }

    if (!editor) throw new Error("Editor not found after waiting");
    return editor as HTMLElement;
};

export const getEditorHTML = (canvasElement: HTMLElement) => {
    const editor = canvasElement.querySelector(".ProseMirror");
    return editor?.innerHTML || "";
};

export const getEditorJSON = (canvasElement: HTMLElement) => {
    const input = canvasElement.querySelector(
        "#storybook-prosemirror-input",
    ) as HTMLInputElement;
    return input ? JSON.parse(input.value) : null;
};

/**
 * Extends the current selection backward by `steps` characters.
 * Works for contenteditable elements and text nodes.
 *
 * @param element - The element or text node where the cursor is.
 * @param text - Number of characters to extend the selection backward.
 */
export async function selectBackward(
    element: HTMLElement | Text,
    text: string,
) {
    const length = text.length;
    if (!element) throw new Error("Element is required");

    // Give browser time to update selection after typing
    await new Promise((resolve) => setTimeout(resolve, 50));

    const selection = window.getSelection();
    if (!selection?.rangeCount) return selection;

    const range = selection.getRangeAt(0).cloneRange();

    // Determine the start of the current selection
    const { startContainer, startOffset } = range;

    // Calculate new start offset
    const newStartOffset = Math.max(0, startOffset - length);

    // Update the range to extend backward
    range.setStart(startContainer, newStartOffset);
    selection.removeAllRanges();
    selection.addRange(range);

    // Wait for selection to stabilize
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify selection
    expect(selection?.toString()).toBe(text);
    return selection;
}

export function deselect(selection: Selection) {
    selection.collapseToEnd();
    expect(selection.toString()).toBe("");
}

/**
 * Verifies that HTML and JSON content match expected values.
 * Reduces duplication in mark story tests.
 *
 * @param canvasElement - The canvas element containing the editor
 * @param expectedHTML - Expected HTML content
 * @param expectedJSON - Expected JSON content
 */
export function verifyEditorContent(
    canvasElement: HTMLElement,
    expectedHTML: string,
    expectedJSON: ProseMirrorDoc,
) {
    const htmlContent = getEditorHTML(canvasElement);
    const jsonContent = getEditorJSON(canvasElement);

    expect(htmlContent).toBe(expectedHTML);
    expect(jsonContent).toEqual(expectedJSON);

    return { htmlContent, jsonContent };
}

/**
 * Verifies that a menu button has the correct active state.
 * Includes retry logic to wait for button state to update after keyboard shortcuts.
 *
 * @param button - The menu button element
 * @param shouldBeActive - Whether the button should be active
 */
export async function verifyMenuButtonState(
    button: HTMLElement,
    shouldBeActive: boolean,
) {
    // Wait for button state to update (needed after keyboard shortcuts)
    let attempts = 0;
    const maxAttempts = 20; // 1 second with 50ms intervals

    while (attempts < maxAttempts) {
        const hasActiveClass = button.classList.contains(
            "ProseMirror-menu-active",
        );

        if (hasActiveClass === shouldBeActive) {
            // State matches expectation
            break;
        }

        // Wait and retry
        await new Promise((resolve) => setTimeout(resolve, 50));
        attempts++;
    }

    // Final assertion
    if (shouldBeActive) {
        expect(button).toHaveClass("ProseMirror-menu-active");
    } else {
        expect(button).not.toHaveClass("ProseMirror-menu-active");
    }
}

/**
 * Creates a paragraph node with text content.
 * Reduces duplication in story tests.
 *
 * @param text - The text content
 * @param marks - Optional marks to apply to the text
 * @returns Paragraph node object
 */
export function createParagraph(
    text: string | ProseMirrorNode[] = "",
    marks: Array<{ type: MarkType; attrs?: Record<string, unknown> }> = [],
): ProseMirrorNode {
    let content: ProseMirrorNode[] | undefined = undefined;

    if (typeof text === "string" && text) {
        content = [
            {
                type: NodeType.TEXT,
                text,
                ...(marks.length > 0 ? { marks } : {}),
            },
        ];
    }

    if (typeof text === "object") {
        content = text;
    }

    return {
        type: NodeType.PARAGRAPH,
        ...(content ? { content } : {}),
    };
}

/**
 * Creates a list item node with paragraph content.
 * Reduces duplication in list story tests.
 *
 * @param text - The text content
 * @param sublist - Optional nested list
 * @returns List item node object
 */
export function createListItem(text: string, sublist?: ProseMirrorNode) {
    const content: ProseMirrorNode[] = [createParagraph(text)];
    if (sublist) {
        content.push(sublist);
    }
    return {
        type: NodeType.LIST_ITEM,
        content,
    };
}

/**
 * Creates a bullet list node.
 * Reduces duplication in list story tests.
 *
 * @param items - Array of list items
 * @returns Bullet list node object
 */
export function createBulletList(items: ProseMirrorNode[]) {
    return {
        type: NodeType.BULLET_LIST,
        content: items,
    };
}

/**
 * Creates an ordered list node.
 * Reduces duplication in list story tests.
 *
 * @param items - Array of list items
 * @param order - Starting number (optional, defaults to 1)
 * @returns Ordered list node object
 */
export function createOrderedList(items: ProseMirrorNode[], order: number = 1) {
    return {
        type: NodeType.ORDERED_LIST,
        attrs: { order },
        content: items,
    };
}

/**
 * Creates a table cell with standard attributes.
 * Reduces duplication in table story tests.
 *
 * @param type - The cell type ("table_cell" or "table_header")
 * @param text - The text content
 * @param attrs - Optional custom attributes
 * @returns Table cell node object
 */
export function createTableCell(
    type: NodeType.TABLE_CELL | NodeType.TABLE_HEADER,
    text: string = "",
    attrs: Attrs = {},
) {
    return {
        type,
        attrs: {
            colspan: 1,
            rowspan: 1,
            colwidth: null,
            ...attrs,
        },
        content: [createParagraph(text)],
    };
}

/**
 * Creates a table row node.
 * Reduces duplication in table story tests.
 *
 * @param cells - Array of table cells
 * @returns Table row node object
 */
export function createTableRow(cells: ProseMirrorNode[]) {
    return {
        type: NodeType.TABLE_ROW,
        content: cells,
    };
}

/**
 * Creates a table node.
 * Reduces duplication in table story tests.
 *
 * @param rows - Array of table rows
 * @returns Table node object
 */
export function createTable(rows: ProseMirrorNode[]) {
    return { type: NodeType.TABLE, content: rows };
}

/**
 * Creates a heading node.
 * Reduces duplication in heading story tests.
 *
 * @param text - The heading text
 * @param level - The heading level (1-6)
 * @returns Heading node object
 */
export function createHeading(text: string, level: number): ProseMirrorNode {
    return {
        type: NodeType.HEADING,
        attrs: { level },
        content: [createTextNode(text)],
    };
}

/**
 * Creates a code block node.
 * Reduces duplication in code block story tests.
 *
 * @param text - The code content
 * @returns Code block node object
 */
export function createCodeBlock(text: string): ProseMirrorNode {
    return {
        type: NodeType.CODE_BLOCK,
        content: [createTextNode(text)],
    };
}

/**
 * Creates a blockquote node.
 * Reduces duplication in blockquote story tests.
 *
 * @param content - Array of content nodes (typically paragraphs)
 * @returns Blockquote node object
 */
export function createBlockquote(content: ProseMirrorNode[]): ProseMirrorNode {
    return { type: NodeType.BLOCKQUOTE, content };
}

/**
 * Creates a horizontal rule node.
 * Reduces duplication in horizontal rule story tests.
 *
 * @returns Horizontal rule node object
 */
export const createHorizontalRule = (): ProseMirrorNode => ({
    type: NodeType.HORIZONTAL_RULE,
});

/**
 * Creates a hard break node.
 * Reduces duplication in hard break story tests.
 *
 * @returns Hard break node object
 */
export const createHardBreak = (): ProseMirrorNode => ({
    type: NodeType.HARD_BREAK,
});

/**
 * Convenience function to create text nodes with optional marks.
 *
 * @param text - The text content
 * @param marks - Optional array of marks to apply
 * @returns Text node with marks
 */
export function createTextNode(
    text: string,
    marks: Array<{ type: MarkType; attrs?: Record<string, unknown> }> = [],
): ProseMirrorNode {
    return {
        type: NodeType.TEXT,
        text,
        ...(marks.length > 0 ? { marks } : {}),
    };
}
