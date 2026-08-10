import { MenuItem } from "prosemirror-menu";
import { MarkType } from "prosemirror-model";
import { icons } from "../icons";
import { toggleMark } from "prosemirror-commands";
import { isMarkActive } from "./utils";
import { openPrompt, TextField } from "./prompt";
import { translate } from "@/i18n/translations";
import { isSafeUrl } from "@/utils/sanitize";

/**
 * Create a link menu item that can add or remove links from selected text.
 * Opens a dialog for link creation or removes existing links.
 * @param markType - The link mark type from the schema
 * @returns MenuItem for link management
 */
export function createLinkMenuItem(markType: MarkType): MenuItem {
    return new MenuItem({
        title: "Add or remove link",
        icon: icons.link,
        active: (state) => isMarkActive(state, markType),
        enable: (state) => !state.selection.empty,
        run: (state, dispatch, view) => {
            // If link is active, remove it
            if (isMarkActive(state, markType)) {
                toggleMark(markType)(state, dispatch);
                return true;
            }
            // Otherwise, open dialog to create link
            openPrompt({
                title: translate("Create a link"),
                fields: {
                    href: new TextField({
                        label: translate("Link target"),
                        required: true,
                        // Reject here rather than leaning on toDOM: that only
                        // neutralises the URL while rendering, so an unsafe
                        // href would still sit in the document, in the form
                        // input, and in whatever gets stored.
                        validate: (value) =>
                            isSafeUrl(value)
                                ? null
                                : translate(
                                      "Only http, https, mailto and tel links are allowed",
                                  ),
                    }),
                    title: new TextField({ label: translate("Title") }),
                },
                callback: (attrs) => {
                    toggleMark(markType, attrs)(view.state, view.dispatch);
                    view.focus();
                },
                dom: view.dom,
            });
            return true;
        },
    });
}
