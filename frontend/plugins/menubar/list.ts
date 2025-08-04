import { MenuItem, MenuItemSpec } from "prosemirror-menu";
import { NodeType } from "prosemirror-model";
import { wrapInList } from "prosemirror-schema-list";
import { createCommandMenuItem } from "./utils";

/**
 * Create a menu item for wrapping selection in a list (bullet or ordered).
 * Uses the prosemirror-schema-list wrapInList command.
 * @param node - The list node type (bullet_list or ordered_list)
 * @param options - Configuration options for the menu item
 * @returns MenuItem for list wrapping
 */
export function createListWrapMenuItem(
    node: NodeType,
    options: Partial<MenuItemSpec>,
): MenuItem {
    return createCommandMenuItem(
        wrapInList(
            node,
            (options as Record<string, unknown>).attrs as
                | Record<string, unknown>
                | null
                | undefined,
        ),
        options,
    );
}
