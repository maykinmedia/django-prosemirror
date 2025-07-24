import { IDPMSettings } from "@/conf/types";
import { baseKeymap } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { buildInputRules, buildKeymap } from "prosemirror-example-setup";
import { gapCursor } from "prosemirror-gapcursor";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { menuBar } from "prosemirror-menu";
import { Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { buildMenuItems } from "./menubar";
import { tablePlugins } from "./table";

export interface DjangoProsemirrorSetup {
    /** The model schema of the editor. */
    schema: Schema;
    /** Set to false to disable the menu bar. */
    menubar?: boolean;
    /** Set to false to disable the history plugin.*/
    history?: boolean;
    /** Set to false to make the menu bar non-floating. */
    floatingMenu?: boolean;
}

/**
 * Get the plugins for the django prosemirror editor.
 * @param settings
 * @returns The array of
 */
export function getDPMPlugins(
    schema: Schema,
    settings?: IDPMSettings,
): (Plugin & {
    type?: string;
    config?: { content: unknown };
    schema?: unknown;
})[] {
    const plugins = [
        /**
         * Table plugin for table cell editing and a floating menubar.
         */
        ...tablePlugins(schema),
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
            // floating: false,
            // floating: settings?.floatingMenu !== false,
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

    return plugins;
}
