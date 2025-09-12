import { fireEvent } from "storybook/test";

/**
 * Simulates pressing a keyboard shortcut on a target element.
 * Handles Cmd (macOS) and Ctrl (Windows/Linux).
 *
 * @param element The target element (editor)
 * @param key The key to press (e.g., "b", "u")
 * @param options Optional additional KeyboardEvent properties
 */
export async function pressShortcut(
    element: HTMLElement,
    key: string,
    options: Partial<KeyboardEventInit> = {},
) {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const modifiers = isMac
        ? { metaKey: true } // ⌘ on macOS
        : { ctrlKey: true }; // Ctrl on Windows/Linux

    const eventInit: KeyboardEventInit = {
        key,
        code: `Key${key.toUpperCase()}`,
        charCode: key === "u" ? 85 : 0,
        bubbles: true,
        cancelable: true,
        ...modifiers,
        ...options,
    };

    // Fire keydown and keyup to simulate a real shortcut
    await fireEvent.keyDown(element, eventInit);
    await fireEvent.keyUp(element, eventInit);
}

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
        await sleep(100);
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

export const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
