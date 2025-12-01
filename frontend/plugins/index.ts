import {
    imageToolbarMenuConfig,
    imageToolbarPlugin,
} from "@/plugins/image-toolbar-plugin";
import { imageUploadPlugin } from "@/plugins/image-upload-plugin";
import { buildMenuItems } from "@/plugins/menubar";
import { tablePlugins } from "@/plugins/table-plugin";
import { toolbarPlugin } from "@/plugins/toolbar-plugin";
import { type DPMSettings } from "@/schema/settings";
import { NodeType } from "@/schema/types";
import { baseKeymap } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { buildInputRules, buildKeymap } from "prosemirror-example-setup";
import { gapCursor } from "prosemirror-gapcursor";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { menuBar } from "prosemirror-menu";
import { Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";

/**
 * Get the plugins for the django prosemirror editor.
 *
 * Function specs:
 * - Assembles and returns all ProseMirror plugins required for the editor
 * - Configures core functionality: settings, toolbar creation, image handling
 * - Includes standard editing features: input rules, keymaps, history, cursors
 * - Conditionally adds table plugins based on schema support
 * - Maintains proper plugin loading order for dependencies
 *
 * @param schema The ProseMirror schema defining document structure
 * @param settings Configuration settings for the editor
 * @returns Array of configured ProseMirror plugins
 */
export function getDPMPlugins(
    schema: Schema,
    settings: DPMSettings,
): (Plugin & {
    type?: string;
    config?: { content: unknown };
    schema?: unknown;
})[] {
    const plugins = [
        /**
         * Core toolbar plugin
         *
         * Plugin specs:
         * - Provides createToolbar factory method to other plugins
         * - Manages contextual toolbar instances and positioning
         * - Handles toolbar lifecycle (show/hide/destroy/update)
         * - Supports both ProseMirror node and HTML element targeting
         * - Must be loaded early as dependency for toolbar-using plugins
         */
        toolbarPlugin(),
        /**
         * Image upload and management plugin
         *
         * Plugin specs:
         * - Handles image uploads via drag-and-drop and paste operations
         * - Processes image resizing and format conversion
         * - Provides keybindings for image deletion (delete, backspace, mod-i)
         * - Manages image node creation and attribute updates
         * - Integrates with backend upload endpoints
         */
        ...(schema.nodes[NodeType.FILER_IMAGE]
            ? imageUploadPlugin(settings, !!schema.nodes[NodeType.FILER_IMAGE])
            : []),
        /**
         * Image-specific toolbar plugin
         *
         * Plugin specs:
         * - Creates contextual toolbar for selected images
         * - Provides image-specific actions (resize, align, delete, alt text)
         * - Uses Preact components for UI rendering
         * - Depends on both toolbarPlugin and imageUploadPlugin
         * - Auto-positions relative to selected image nodes
         */
        ...(schema.nodes[NodeType.FILER_IMAGE]
            ? [imageToolbarPlugin(imageToolbarMenuConfig)]
            : []),
        /**
         * Table plugin for table cell editing and a floating menubar.
         */
        ...(schema.nodes.table ? tablePlugins() : []),
        /**
         * Input rules for smart quotes and creating the block types in the schema
         * using markdown conventions.
         */
        buildInputRules(schema),
        /**
         * A keymap that defines keys to create and manipulate the nodes in the schema
         */
        keymap(buildKeymap(schema)),
        /**
         * A keymap binding the default keys provided by the
         * prosemirror-commands module
         */
        keymap(baseKeymap),
        /**
         * The drop cursor plugin
         */
        dropCursor(),
        /**
         * The gap cursor plugin
         */
        gapCursor(),
        /**
         * The menubar plugin
         */
        menuBar({
            floating: settings?.floatingMenu !== false,
            content: buildMenuItems(schema, settings?.history).fullMenu,
        }),
        /**
         * The undo history plugin
         */
        history(),
    ];

    // TODO once we add (more) settings include this part so the menubar/history can be turned off.
    // if (settings.menubar !== false)
    //     plugins.push(
    //         menuBar({
    //             floating: settings.floatingMenu !== false,
    //             content: buildMenuItems(settings.schema, settings.history)
    //                 .fullMenu,
    //         })
    //     );

    // if (settings.history !== false) plugins.push(history());

    return plugins.filter((x) => !!x);
}
