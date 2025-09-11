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
    const a = await fireEvent.keyDown(element, eventInit);
    console.log(a);
    const b = await fireEvent.keyUp(element, eventInit);
    console.log(b);
}
