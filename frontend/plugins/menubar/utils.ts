import { MenuItem, MenuItemSpec } from "prosemirror-menu";
import { Attrs, MarkType, NodeType } from "prosemirror-model";
import { Command, EditorState } from "prosemirror-state";
import { setBlockType, toggleMark } from "prosemirror-commands";

// Helpers to create specific types of items
export function canInsert(state: EditorState, nodeType: NodeType) {
    const $from = state.selection.$from;
    for (let d = $from.depth; d >= 0; d--) {
        const index = $from.index(d);
        if ($from.node(d).canReplaceWith(index, index, nodeType)) return true;
    }
    return false;
}

// export function cut<T>(arr: T[]): T[] {
// return arr.filter(Boolean);
// }

export function cut<T>(arr: (T | null | undefined)[]): T[] {
    return arr.filter((x): x is T => !!x);
}

/**
 * Check if a specific mark type is active in the current selection.
 * Handles both empty selections (cursor position) and text selections.
 * @param state - Current editor state
 * @param type - Mark type to check for
 * @returns True if the mark is active, false otherwise
 */
export function isMarkActive(state: EditorState, mark: MarkType): boolean {
    const { from, $from, to, empty } = state.selection;
    if (empty) return !!mark.isInSet(state.storedMarks || $from.marks());
    else return state.doc.rangeHasMark(from, to, mark);
}

/**
 * Create a generic menu item that executes a ProseMirror command.
 * Handles enable/select state and provides consistent menu item creation.
 * @param cmd - The ProseMirror command to execute
 * @param options - Configuration options for the menu item
 * @returns Configured MenuItem
 */
export function createCommandMenuItem(
    cmd: Command,
    options: Partial<MenuItemSpec>,
): MenuItem {
    const passedOptions: MenuItemSpec = {
        label: options.title as string | undefined,
        run: cmd,
        ...options,
    };

    // Set up enable/select logic if not provided
    if (!options.enable && !options.select) {
        passedOptions[options.enable ? "enable" : "select"] = (state) =>
            cmd(state);
    }

    return new MenuItem(passedOptions);
}

/**
 * Create a menu item that changes the block type (paragraph, heading, etc.).
 * Sets up the command and enable logic for block type transformations.
 * @param node - The target node type
 * @param options - Configuration options including optional attributes
 * @returns MenuItem for changing block types
 */
export function createBlockTypeMenuItem(
    node: NodeType,
    options: Partial<MenuItemSpec> & { attrs?: Attrs | null },
): MenuItem {
    const command = setBlockType(node, options.attrs);
    const passedOptions: MenuItemSpec = {
        run: command,
        enable: (state) => command(state),
        ...options,
    };

    return new MenuItem(passedOptions);
}

/**
 * Create a menu item for toggling text marks (bold, italic, etc.).
 * Handles the active state detection and provides the toggle functionality.
 * @param markType - The type of mark to toggle
 * @param options - Additional options for the menu item
 * @returns MenuItem for toggling the specified mark
 */
export function markItem(markType: MarkType, options: Partial<MenuItemSpec>) {
    const passedOptions: Partial<MenuItemSpec> = {
        // Check if the mark is currently active in the selection
        active: (state) => {
            return isMarkActive(state, markType);
        },
        ...options,
    };
    // Merge all passed options
    for (const prop in options)
        (passedOptions as Record<string, unknown>)[prop] = (
            options as Record<string, unknown>
        )[prop];

    return createCommandMenuItem(toggleMark(markType), passedOptions);
}
