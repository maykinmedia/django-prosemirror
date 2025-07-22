import { MenuItem } from "prosemirror-menu";
import { Attrs, NodeType } from "prosemirror-model";
import { icons } from "../icons";
import { canInsert } from "./utils";
import { openPrompt, TextField } from "./prompt";
import { translate } from "@/i18n/translations";
import { NodeSelection } from "prosemirror-state";

/**
 * Create an insert image menu item with a dialog for entering image properties.
 * Opens a prompt allowing users to specify image source, title, and alt text.
 * @param node - The image node type from the schema
 * @returns MenuItem for inserting images
 */
export function createImageMenuItem(node: NodeType): MenuItem {
    return new MenuItem({
        title: "Insert image",
        label: "Image",
        icon: icons.image,
        enable: (state) => canInsert(state, node),
        run: (state, _, view) => {
            const { from, to } = state.selection;
            let attrs: Attrs | null = null;

            // If an image is already selected, populate the form with its attributes
            if (
                state.selection instanceof NodeSelection &&
                state.selection.node.type === node
            ) {
                attrs = state.selection.node.attrs;
            }

            // Open dialog for image properties
            openPrompt({
                title: translate("Insert image"),
                fields: {
                    src: new TextField({
                        label: translate("Location"),
                        required: true,
                        value: attrs?.src,
                    }),
                    title: new TextField({
                        label: translate("Title"),
                        value: attrs?.title,
                    }),
                    alt: new TextField({
                        label: translate("Description"),
                        value:
                            attrs?.alt || state.doc.textBetween(from, to, " "),
                    }),
                },
                dom: view.dom,
                callback: (attrs) => {
                    // Insert the image with specified attributes
                    view.dispatch(
                        view.state.tr.replaceSelectionWith(
                            node.createAndFill(attrs)!,
                        ),
                    );
                    view.focus();
                },
            });
        },
    });
}
