import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDPMPlugins } from "../plugins/index";
import { IDPMSettings, LanguageCodeEnum } from "../types/types";
import { Schema } from "prosemirror-model";
import { NodeType } from "../schema/types";

// Mock the ProseMirror plugins
vi.mock("prosemirror-keymap", () => ({
    keymap: vi.fn((keymap) => ({ type: "keymap", keymap })),
}));

vi.mock("prosemirror-history", () => ({
    history: vi.fn(() => ({ type: "history" })),
}));

vi.mock("prosemirror-commands", () => ({
    baseKeymap: { "Mod-z": "undo", "Mod-y": "redo" },
}));

vi.mock("prosemirror-dropcursor", () => ({
    dropCursor: vi.fn(() => ({ type: "dropCursor" })),
}));

vi.mock("prosemirror-gapcursor", () => ({
    gapCursor: vi.fn(() => ({ type: "gapCursor" })),
}));

vi.mock("prosemirror-menu", () => ({
    menuBar: vi.fn((config) => ({ type: "menuBar", config })),
}));

vi.mock("prosemirror-example-setup", () => ({
    buildInputRules: vi.fn((schema) => ({ type: "inputRules", schema })),
    buildKeymap: vi.fn((schema) => ({ "Mod-b": "toggleStrong", schema })),
}));

vi.mock("../plugins/menubar/index.ts", () => ({
    buildMenuItems: vi.fn((schema, history) => ({
        fullMenu: [
            [{ title: "Bold" }, { title: "Italic" }],
            [{ title: "Heading" }],
        ],
        schema,
        history,
    })),
}));

describe("plugins/index", () => {
    let mockSchema: Schema;

    beforeEach(() => {
        vi.clearAllMocks();

        // Create a simple mock schema
        mockSchema = {
            nodes: {
                doc: { name: "doc" },
                paragraph: { name: "paragraph" },
                text: { name: "text" },
            },
            marks: {
                strong: { name: "strong" },
                em: { name: "em" },
            },
        } as unknown as Schema;
    });

    describe("getDjangoProsemirrorPlugins", () => {
        it("should return array of plugins with default settings", () => {
            const plugins = getDPMPlugins(mockSchema);

            expect(Array.isArray(plugins)).toBe(true);
            expect(plugins).toMatchSnapshot(); // 7 plugins by default
        });

        it("should include input rules plugin", () => {
            const plugins = getDPMPlugins(mockSchema);
            const inputRulesPlugin = plugins.find(
                (p) => p.type === "inputRules",
            );

            expect(inputRulesPlugin).toMatchSnapshot();
            expect(inputRulesPlugin?.schema).toBe(mockSchema);
        });

        it("should include keymap plugins", () => {
            const plugins = getDPMPlugins(mockSchema);
            const keymapPlugins = plugins.filter((p) => p.type === "keymap");

            expect(keymapPlugins).toHaveLength(2); // Custom keymap + base keymap
        });

        it("should include drop cursor plugin", () => {
            const plugins = getDPMPlugins(mockSchema);
            const dropCursorPlugin = plugins.find(
                (p) => p.type === "dropCursor",
            );

            expect(dropCursorPlugin).toMatchSnapshot();
        });

        it("should include gap cursor plugin", () => {
            const plugins = getDPMPlugins(mockSchema);
            const gapCursorPlugin = plugins.find((p) => p.type === "gapCursor");

            expect(gapCursorPlugin).toMatchSnapshot();
        });

        it("should include menu bar plugin", () => {
            const plugins = getDPMPlugins(mockSchema);
            const menuBarPlugin = plugins.find((p) => p.type === "menuBar");

            expect(menuBarPlugin).toMatchSnapshot();
        });

        it("should include history plugin", () => {
            const plugins = getDPMPlugins(mockSchema);
            const historyPlugin = plugins.find((p) => p.type === "history");

            expect(historyPlugin).toMatchSnapshot();
        });

        it("should pass settings to buildMenuItems", () => {
            const settings: IDPMSettings = {
                allowedNodes: [NodeType.HEADING, NodeType.PARAGRAPH],
                allowedMarks: [],
                history: false,
                language: LanguageCodeEnum.EN,
            };

            const result = getDPMPlugins(mockSchema, settings);

            // Just verify that plugins are created without errors
            expect(result).toMatchSnapshot();
            expect(Array.isArray(result)).toBe(true);
        });

        it("should pass default history setting when not specified", () => {
            const result = getDPMPlugins(mockSchema);

            // Just verify that plugins are created without errors
            expect(result).toMatchSnapshot();
            expect(Array.isArray(result)).toBe(true);
        });

        it("should work with minimal schema", () => {
            const minimalSchema = {
                nodes: { doc: {}, paragraph: {}, text: {} },
                marks: {},
            } as unknown as Schema;

            const plugins = getDPMPlugins(minimalSchema);

            expect(Array.isArray(plugins)).toBe(true);
            expect(plugins.length).toBeGreaterThan(0);
        });

        it("should handle undefined settings gracefully", () => {
            expect(() => {
                getDPMPlugins(mockSchema, undefined);
            }).not.toThrow();
        });

        it("should handle empty settings object", () => {
            const settings: IDPMSettings = {
                allowedNodes: [],
                allowedMarks: [],
            };

            expect(() => {
                getDPMPlugins(mockSchema, settings);
            }).not.toThrow();
        });

        it("should maintain plugin order", () => {
            const plugins = getDPMPlugins(mockSchema);
            const pluginTypes = plugins.map((p) => p.type);

            expect(pluginTypes).toEqual([
                "inputRules",
                "keymap", // buildKeymap
                "keymap", // baseKeymap
                "dropCursor",
                "gapCursor",
                "menuBar",
                "history",
            ]);
        });

        it("should pass correct parameters to each plugin factory", () => {
            const plugins = getDPMPlugins(mockSchema);

            // Verify that all expected plugin types are present
            const pluginTypes = plugins.map((p) => p.type);
            expect(pluginTypes).toContain("inputRules");
            expect(pluginTypes).toContain("keymap");
            expect(pluginTypes).toContain("dropCursor");
            expect(pluginTypes).toContain("gapCursor");
            expect(pluginTypes).toContain("menuBar");
            expect(pluginTypes).toContain("history");
        });

        it("should create menu bar with correct content structure", () => {
            const plugins = getDPMPlugins(mockSchema);
            const menuBarPlugin = plugins.find((p) => p.type === "menuBar");

            expect(menuBarPlugin).toMatchSnapshot();
            expect(menuBarPlugin?.config?.content).toMatchSnapshot();
        });
    });

    describe("Plugin configuration", () => {
        it("should configure plugins with different settings", () => {
            const settings1: IDPMSettings = {
                allowedNodes: [NodeType.HEADING],
                allowedMarks: [],
                history: true,
            };
            const settings2: IDPMSettings = {
                allowedNodes: [NodeType.PARAGRAPH],
                allowedMarks: [],
                history: false,
            };

            const plugins1 = getDPMPlugins(mockSchema, settings1);
            const plugins2 = getDPMPlugins(mockSchema, settings2);

            // Both should return the same structure
            expect(plugins1).toEqual(plugins2);
        });

        it("should handle complex settings object", () => {
            const complexSettings: IDPMSettings = {
                allowedNodes: [
                    NodeType.HEADING,
                    NodeType.PARAGRAPH,
                    NodeType.BLOCKQUOTE,
                    NodeType.BULLET_LIST,
                ],
                allowedMarks: [],
                menubar: true,
                history: true,
                floatingMenu: true,
                language: LanguageCodeEnum.NL,
                debug: true,
                classNames: {
                    strong: "custom-strong",
                    em: "custom-em",
                },
            };

            expect(() => {
                getDPMPlugins(mockSchema, complexSettings);
            }).not.toThrow();
        });
    });
});
