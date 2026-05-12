import { MenuItem, MenuItemSpec } from "prosemirror-menu";
import { Attrs, NodeType } from "prosemirror-model";
import { wrapRangeInList } from "prosemirror-schema-list";
import { createCommandMenuItem } from "./utils";
import { Command, EditorState } from "prosemirror-state";
import { smartLift } from "./lift";

export function isSelectionInAnyList(state: EditorState): boolean {
    const { $from } = state.selection;
    const listItemType = state.schema.nodes.list_item;
    if (!listItemType) return false;
    for (let d = $from.depth; d >= 1; d--) {
        if ($from.node(d).type === listItemType) return true;
    }
    return false;
}

function selectionIsFirstItemOf(
    listType: NodeType,
): (state: EditorState) => boolean {
    return (state) => {
        const { $from } = state.selection;
        const listItemType = state.schema.nodes.list_item;
        if (!listItemType) return false;
        for (let d = $from.depth; d >= 1; d--) {
            if ($from.node(d).type !== listItemType) continue;
            return (
                $from.node(d - 1).type === listType && $from.index(d - 1) === 0
            );
        }
        return false;
    };
}

export function createLiftMenuItem(options: Partial<MenuItemSpec>): MenuItem {
    return createCommandMenuItem(smartLift, options);
}

/**
 * Create a menu item for wrapping selection in a list (bullet or ordered).
 *
 * - Always enabled when the selection is inside any list, or when wrapping
 *   is possible. Disabled only when a list can't be created.
 * - Active when the selection is in the first item of this specific list type.
 */
export function createListWrapMenuItem(
    node: NodeType,
    options: Partial<MenuItemSpec>,
): MenuItem {
    const cmd = wrapInList(
        node,
        (options as Record<string, unknown>).attrs as Attrs | null | undefined,
    );
    return createCommandMenuItem(cmd, {
        ...options,
        active: selectionIsFirstItemOf(node),
        enable: (state) => isSelectionInAnyList(state) || cmd(state),
    });
}

/**
 * Wraps the selection in a list with the given type and attributes.
 *
 * Behaviour:
 * - First item (or whole-list selection): switches the enclosing list's type
 *   in-place. Only the OTHER list type is enabled.
 * - Second or later item: wraps in a nested sub-list.
 * - Outside a list: wraps selection in a new list.
 */
function wrapInList(listType: NodeType, attrs?: Attrs | null): Command {
    return (state, dispatch) => {
        const { $from, $to } = state.selection;
        const listItemType = state.schema.nodes.list_item;

        if (listItemType) {
            for (let d = $from.depth; d >= 1; d--) {
                if ($from.node(d).type !== listItemType) continue;

                const listDepth = d - 1;
                const listNode = $from.node(listDepth);

                if ($from.index(listDepth) === 0) {
                    // First item: switch list type in-place (only if different type).
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

                // Second or later item: fall through to sub-list wrap.
                break;
            }
        }

        const range = $from.blockRange($to);
        if (!range) return false;
        const tr = dispatch ? state.tr : null;
        if (!wrapRangeInList(tr, range, listType, attrs)) return false;
        if (tr && dispatch) dispatch(tr.scrollIntoView());
        return true;
    };
}
