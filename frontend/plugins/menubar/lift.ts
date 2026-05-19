import { Fragment, NodeType, Slice } from "prosemirror-model";
import { liftListItem } from "prosemirror-schema-list";
import { Command } from "prosemirror-state";
import { lift } from "prosemirror-commands";

/**
 * Generic lift command. Delegates to smartLiftListItem when the cursor is
 * inside a list item, otherwise falls back to the standard lift command.
 */
export const smartLift: Command = (state, dispatch, view) => {
    const listItemType = state.schema.nodes.list_item;
    if (listItemType) {
        const { $from } = state.selection;
        for (let d = $from.depth; d >= 1; d--) {
            if ($from.node(d).type === listItemType)
                return smartLiftListItem(listItemType)(state, dispatch, view);
        }
    }
    return lift(state, dispatch, view);
};

/**
 * Lift the selected list item out of its containing nested list and into the
 * parent list as a new sibling item.
 *
 * Handles the "continuation-style" nesting where a sub-list is a child block
 * inside a list_item (rather than being nested at the same list level):
 *
 *   1. parent item          1. parent item
 *      - nested item   →   2. nested item
 *
 * Falls back to prosemirror-schema-list's liftListItem for classic nesting,
 * and to the generic `lift` command when outside a list entirely.
 */
export function smartLiftListItem(listItemType: NodeType): Command {
    return (state, dispatch) => {
        const { $from, $to } = state.selection;

        const range = $from.blockRange(
            $to,
            (node) =>
                node.childCount > 0 && node.firstChild!.type === listItemType,
        );

        // Not in a list context — fall back to generic lift.
        if (!range) return lift(state, dispatch);

        // Not nested inside an outer list_item — use standard liftListItem.
        if (
            range.depth < 2 ||
            $from.node(range.depth - 1).type !== listItemType
        ) {
            return liftListItem(listItemType)(state, dispatch);
        }

        if (!dispatch) return true;

        const innerListNode = $from.node(range.depth); // e.g. bullet_list
        const outerListItemNode = $from.node(range.depth - 1); // the containing list_item
        const innerItemIndex = $from.index(range.depth); // index of promoted item in inner list
        const innerListIndexInOuter = $from.index(range.depth - 1); // index of inner list in outer list_item
        const innerListItemNode = $from.node(range.depth + 1); // the list_item being promoted

        // Build the updated outer list_item:
        //   content before the inner list + any inner list items BEFORE the promoted one
        let newOuterContent = Fragment.empty;
        for (let i = 0; i < innerListIndexInOuter; i++) {
            newOuterContent = newOuterContent.append(
                Fragment.from(outerListItemNode.child(i)),
            );
        }
        let beforeSiblings = Fragment.empty;
        for (let i = 0; i < innerItemIndex; i++) {
            beforeSiblings = beforeSiblings.append(
                Fragment.from(innerListNode.child(i)),
            );
        }
        if (beforeSiblings.childCount > 0) {
            newOuterContent = newOuterContent.append(
                Fragment.from(
                    innerListNode.type.create(
                        innerListNode.attrs,
                        beforeSiblings,
                    ),
                ),
            );
        }
        // Content in outer list_item after the inner list (rare, but preserve it)
        for (
            let i = innerListIndexInOuter + 1;
            i < outerListItemNode.childCount;
            i++
        ) {
            newOuterContent = newOuterContent.append(
                Fragment.from(outerListItemNode.child(i)),
            );
        }

        // Cannot produce a valid outer list_item with no content — bail out.
        if (newOuterContent.childCount === 0) {
            return liftListItem(listItemType)(state, dispatch);
        }

        const newOuterListItem = listItemType.create(
            outerListItemNode.attrs,
            newOuterContent,
        );

        // Build the promoted list_item:
        //   content of the promoted item + any inner list items AFTER it (re-nested)
        let newItemContent = innerListItemNode.content;
        let afterSiblings = Fragment.empty;
        for (let i = innerItemIndex + 1; i < innerListNode.childCount; i++) {
            afterSiblings = afterSiblings.append(
                Fragment.from(innerListNode.child(i)),
            );
        }
        if (afterSiblings.childCount > 0) {
            newItemContent = newItemContent.append(
                Fragment.from(
                    innerListNode.type.create(
                        innerListNode.attrs,
                        afterSiblings,
                    ),
                ),
            );
        }

        const newListItem = listItemType.create(
            innerListItemNode.attrs,
            newItemContent,
        );

        // Replace the outer list_item with [updatedOuterListItem, promotedListItem]
        const outerListItemBefore = $from.before(range.depth - 1);
        const outerListItemAfter = $from.after(range.depth - 1);
        const tr = state.tr.replace(
            outerListItemBefore,
            outerListItemAfter,
            new Slice(Fragment.from([newOuterListItem, newListItem]), 0, 0),
        );
        dispatch(tr.scrollIntoView());
        return true;
    };
}
