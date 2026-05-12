import { MenuItem, MenuItemSpec } from "prosemirror-menu";
import { Attrs, NodeType } from "prosemirror-model";
import { liftListItem, wrapRangeInList } from "prosemirror-schema-list";
import { createCommandMenuItem } from "./utils";
import { Command } from "prosemirror-state";
import { lift } from "prosemirror-commands";

/**
 * Create a menu item for lifting a list item up into the parent list, or
 * out of a block container when not inside a nested list.
 * @param listItemType - The list_item node type from the schema
 * @param options - Configuration options for the menu item
 * @returns MenuItem for lifting
 */
export function createLiftMenuItem(
    listItemType: NodeType,
    options: Partial<MenuItemSpec>,
): MenuItem {
    const cmd: Command = (state, dispatch) =>
        liftListItem(listItemType)(state, dispatch) || lift(state, dispatch);
    return createCommandMenuItem(cmd, options);
}

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

/**
Returns a command function that wraps the selection in a list with
the given type an attributes. If `dispatch` is null, only return a
value to indicate whether this is possible, but don't actually
perform the change.

Behaviour depends on where the selection is:
- First item (or selection starting from it): only the OTHER list type
  is enabled; clicking changes the enclosing list's type in-place.
- Second or later item: both types are enabled; clicking creates a
  nested sub-list (original prosemirror-schema-list behaviour).
- Whole list selected: treated the same as the first-item case.
- Outside a list: wraps selection in a new list.
*/
function wrapInList(listType: NodeType, attrs?: Attrs | null): Command {
    return function (state, dispatch) {
        const { $from, $to } = state.selection;
        const listItemType = state.schema.nodes.list_item;

        if (listItemType) {
            // Walk up from $from to find the innermost list_item ancestor.
            for (let d = $from.depth; d >= 1; d--) {
                if ($from.node(d).type !== listItemType) continue;

                const listDepth = d - 1;
                const listNode = $from.node(listDepth);
                const startItemIndex = $from.index(listDepth);

                if (startItemIndex === 0) {
                    // Spec 1 & 3 – first item or whole-list selection:
                    // only enable the OTHER list type to switch in-place.
                    if (listNode.type === listType) return false;
                    if (dispatch) {
                        dispatch(
                            state.tr
                                .setNodeMarkup(
                                    $from.before(listDepth),
                                    listType,
                                    attrs,
                                )
                                .scrollIntoView(),
                        );
                    }
                    return true;
                }

                // Spec 2 – second or later item: fall through to sub-list wrap.
                break;
            }
        }

        // Outside a list, or in a second+ item: wrap in (sub-)list.
        const range = $from.blockRange($to);
        if (!range) return false;
        const tr = dispatch ? state.tr : null;
        if (!wrapRangeInList(tr, range, listType, attrs)) return false;
        if (tr && dispatch) dispatch(tr.scrollIntoView());
        return true;
    };
}
