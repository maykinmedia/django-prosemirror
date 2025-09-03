import { Plugin, PluginKey } from "prosemirror-state";
import { ToolbarMethods } from "./types";
import { ToolbarInstance } from "./components";

export const toolbarPluginKey = new PluginKey<ToolbarMethods>("toolbar-plugin");

// Extends EditorState with this plugin
declare module "prosemirror-state" {
    interface EditorState {
        "toolbar-plugin$"?: ToolbarMethods;
    }
}

/**
 * Plugin that exposes creatable toolbar.
 *
 * This allows easy de-connect of a new toolbar plugin if this
 * plugin contains the same specs as this toolbar plugin
 *
 * Plugin specs:
 * - Provides a createToolbar method that instantiates contextual toolbars
 * - Supports positioning toolbars relative to ProseMirror nodes or HTML elements
 * - Handles toolbar visibility, positioning, and lifecycle management
 * - Accepts customizable menu items with icons, commands, and dropdown support
 * - Automatically repositions on scroll/resize with throttled updates
 */
export const toolbarPlugin = () => {
    return new Plugin({
        key: toolbarPluginKey,
        state: {
            init() {
                const methods: ToolbarMethods = {
                    createToolbar(view, target, createMenuItems, shouldShow) {
                        return new ToolbarInstance(
                            view,
                            target,
                            createMenuItems,
                            shouldShow,
                        );
                    },
                };

                return methods;
            },

            apply(_tr, pluginState) {
                return pluginState;
            },
        },
    });
};
