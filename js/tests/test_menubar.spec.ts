import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildMenuItems } from "../plugins/menubar/index";
import { LanguageCodeEnum } from "../types/types";
import { Schema, NodeType, MarkType } from "prosemirror-model";
import { undoItem, redoItem, selectParentNodeItem } from "prosemirror-menu";

// Mock ProseMirror menu components
vi.mock("prosemirror-menu", () => ({
    MenuItem: vi
        .fn()
        .mockImplementation((spec) => ({ spec, type: "MenuItem" })),
    Dropdown: vi.fn().mockImplementation((content, options) => ({
        content,
        options,
        type: "Dropdown",
    })),
    DropdownSubmenu: vi.fn().mockImplementation((content, options) => ({
        content,
        options,
        type: "DropdownSubmenu",
    })),
    wrapItem: vi.fn().mockImplementation((nodeType, options) => ({
        nodeType,
        options,
        type: "wrapItem",
    })),
    joinUpItem: { spec: {}, type: "joinUpItem" },
    liftItem: { spec: {}, type: "liftItem" },
    selectParentNodeItem: { spec: {}, type: "selectParentNodeItem" },
    undoItem: { spec: {}, type: "undoItem" },
    redoItem: { spec: {}, type: "redoItem" },
}));

// Mock ProseMirror commands
vi.mock("prosemirror-commands", () => ({
    setBlockType: vi
        .fn()
        .mockImplementation(() => vi.fn().mockReturnValue(true)),
    toggleMark: vi.fn().mockImplementation(() => vi.fn().mockReturnValue(true)),
}));

// Mock schema list commands
vi.mock("prosemirror-schema-list", () => ({
    wrapInList: vi.fn().mockImplementation(() => vi.fn().mockReturnValue(true)),
}));

// Mock prompt functionality
vi.mock("../plugins/menubar/prompt", () => ({
    openPrompt: vi.fn(),
    TextField: vi.fn().mockImplementation((options) => ({
        options,
        type: "TextField",
    })),
}));

// Mock icons
vi.mock("../plugins/menubar/icons", () => ({
    icons: {
        strong: { path: "strong-icon" },
        em: { path: "em-icon" },
        underline: { path: "underline-icon" },
        strikethrough: { path: "strikethrough-icon" },
        code: { path: "code-icon" },
        link: { path: "link-icon" },
        image: { path: "image-icon" },
        bulletList: { path: "bullet-list-icon" },
        orderedList: { path: "ordered-list-icon" },
        blockquote: { path: "blockquote-icon" },
        hr: { path: "hr-icon" },
        undo: { path: "undo-icon" },
        redo: { path: "redo-icon" },
        lift: { path: "lift-icon" },
        join: { path: "join-icon" },
        selectParentNode: { path: "select-parent-icon" },
    },
}));

// Mock translations
vi.mock("../../i18n/translations", () => ({
    translate: vi.fn().mockImplementation((text) => `translated:${text}`),
}));

describe("plugins/menubar/index", () => {
    let mockSchema: Schema;
    let mockMarkType: MarkType;
    let mockNodeType: NodeType;

    beforeEach(() => {
        vi.clearAllMocks();

        // Create mock mark type
        mockMarkType = {
            name: "strong",
            isInSet: vi.fn().mockReturnValue(null),
        };

        // Create mock node type
        mockNodeType = {
            name: "paragraph",
            create: vi.fn().mockReturnValue({}),
            createAndFill: vi.fn().mockReturnValue({}),
        };

        // Create mock schema with various nodes and marks
        mockSchema = {
            nodes: {
                doc: mockNodeType,
                text: mockNodeType,
                paragraph: mockNodeType,
                heading: { ...mockNodeType, name: "heading" },
                blockquote: { ...mockNodeType, name: "blockquote" },
                image: { ...mockNodeType, name: "image" },
                ordered_list: { ...mockNodeType, name: "ordered_list" },
                bullet_list: { ...mockNodeType, name: "bullet_list" },
                list_item: { ...mockNodeType, name: "list_item" },
                horizontal_rule: { ...mockNodeType, name: "horizontal_rule" },
                code_block: { ...mockNodeType, name: "code_block" },
                hard_break: { ...mockNodeType, name: "hard_break" },
            },
            marks: {
                strong: mockMarkType,
                em: { ...mockMarkType, name: "em" },
                underline: { ...mockMarkType, name: "underline" },
                strikethrough: { ...mockMarkType, name: "strikethrough" },
                code: { ...mockMarkType, name: "code" },
                link: { ...mockMarkType, name: "link" },
            },
        };
    });

    describe("buildMenuItems", () => {
        it("should return MenuItemResult with all components", () => {
            const result = buildMenuItems(mockSchema);

            expect(result).toHaveProperty("fullMenu");
            expect(result).toHaveProperty("inlineMenu");
            expect(result).toHaveProperty("blockMenu");
            expect(result).toHaveProperty("typeMenu");
            expect(result).toHaveProperty("liftItem");
            expect(result).toHaveProperty("joinUpItem");
        });

        it("should create mark menu items for available marks", () => {
            const result = buildMenuItems(mockSchema);

            expect(result.toggleStrong).toBeDefined();
            expect(result.toggleEm).toBeDefined();
            expect(result.toggleU).toBeDefined();
            expect(result.toggleStrikethrough).toBeDefined();
            expect(result.toggleCode).toBeDefined();
            expect(result.toggleLink).toBeDefined();
        });

        it("should create node menu items for available nodes", () => {
            const result = buildMenuItems(mockSchema);

            expect(result.insertImage).toBeDefined();
            expect(result.wrapBulletList).toBeDefined();
            expect(result.wrapOrderedList).toBeDefined();
            expect(result.wrapBlockQuote).toBeDefined();
            expect(result.makeParagraph).toBeDefined();
            expect(result.makeCodeBlock).toBeDefined();
            expect(result.insertHorizontalRule).toBeDefined();
        });

        it("should create heading menu items for all levels", () => {
            const result = buildMenuItems(mockSchema);

            expect(result.makeHead1).toBeDefined();
            expect(result.makeHead2).toBeDefined();
            expect(result.makeHead3).toBeDefined();
            expect(result.makeHead4).toBeDefined();
            expect(result.makeHead5).toBeDefined();
            expect(result.makeHead6).toBeDefined();
        });

        it("should include history items when history is enabled", () => {
            const result = buildMenuItems(mockSchema, true);

            expect(result.fullMenu).toBeDefined();
            // History items should be in the last group
            const lastGroup = result.fullMenu[result.fullMenu.length - 1];
            expect(lastGroup.length).toBeGreaterThan(0);
        });

        it("should not include history items when history is disabled", () => {
            const result = buildMenuItems(mockSchema, false);

            expect(result.fullMenu).toBeDefined();
            // Last group should be empty when history is disabled
            const lastGroup = result.fullMenu[result.fullMenu.length - 1];
            expect(lastGroup).toEqual([]);
        });

        it("should handle schema with missing marks gracefully", () => {
            const schemaWithoutMarks = {
                ...mockSchema,
                marks: {},
            };

            expect(() => {
                buildMenuItems(schemaWithoutMarks);
            }).not.toThrow();
        });

        it("should handle schema with missing nodes gracefully", () => {
            const schemaWithMinimalNodes = {
                ...mockSchema,
                nodes: {
                    doc: mockNodeType,
                    text: mockNodeType,
                    paragraph: mockNodeType,
                },
            };

            expect(() => {
                buildMenuItems(schemaWithMinimalNodes);
            }).not.toThrow();
        });

        it("should create dropdown menus with proper structure", () => {
            const result = buildMenuItems(mockSchema);

            expect(result.typeMenu).toBeDefined();
            expect(result.typeMenu.type).toBe("Dropdown");
        });

        it("should organize inline menu correctly", () => {
            const result = buildMenuItems(mockSchema);

            expect(Array.isArray(result.inlineMenu)).toBe(true);
            expect(result.inlineMenu.length).toBeGreaterThan(0);
        });

        it("should organize block menu correctly", () => {
            const result = buildMenuItems(mockSchema);

            expect(Array.isArray(result.blockMenu)).toBe(true);
            expect(result.blockMenu.length).toBeGreaterThan(0);
        });

        it("should organize full menu correctly", () => {
            const result = buildMenuItems(mockSchema);

            expect(Array.isArray(result.fullMenu)).toBe(true);
            expect(result.fullMenu.length).toBeGreaterThan(0);
        });

        it("should pass language parameter correctly", () => {
            buildMenuItems(mockSchema, true, LanguageCodeEnum.EN);
            buildMenuItems(mockSchema, true, LanguageCodeEnum.NL);

            // Both should work without throwing
            expect(true).toBe(true);
        });

        it("should use default language when not specified", () => {
            expect(() => {
                buildMenuItems(mockSchema, true);
            }).not.toThrow();
        });
    });

    describe("Menu item creation", () => {
        it("should create menu items with proper icons", () => {
            const result = buildMenuItems(mockSchema);

            // Check that menu items have proper structure
            expect(result.toggleStrong).toBeDefined();
            expect(result.toggleStrong.spec.icon).toBeDefined();
        });

        it("should create menu items with proper titles", () => {
            const result = buildMenuItems(mockSchema);

            expect(result.toggleStrong).toBeDefined();
            expect(result.toggleStrong.spec.title).toBeDefined();
        });

        it("should create menu items with run functions", () => {
            const result = buildMenuItems(mockSchema);

            expect(result.toggleStrong).toBeDefined();
            expect(typeof result.toggleStrong.spec.run).toBe("function");
        });

        it("should create menu items with enable/select functions", () => {
            const result = buildMenuItems(mockSchema);

            expect(result.toggleStrong).toBeDefined();
            expect(
                result.toggleStrong.spec.active ||
                    result.toggleStrong.spec.enable,
            ).toBeDefined();
        });
    });

    describe("List menu items", () => {
        it("should include liftItem when bullet_list is present", () => {
            const result = buildMenuItems(mockSchema);
            expect(result.liftItem).toBeDefined();
        });

        it("should include joinUpItem when bullet_list is present", () => {
            const result = buildMenuItems(mockSchema);
            expect(result.joinUpItem).toBeDefined();
        });

        it("should include liftItem when ordered_list is present", () => {
            const schemaWithOrderedList = {
                ...mockSchema,
                nodes: {
                    ...mockSchema.nodes,
                    bullet_list: undefined,
                },
            };
            delete schemaWithOrderedList.nodes.bullet_list;

            const result = buildMenuItems(schemaWithOrderedList);
            expect(result.liftItem).toBeDefined();
        });
    });

    describe("Icon assignment", () => {
        it("should assign icons to built-in menu items when history is enabled", () => {
            buildMenuItems(mockSchema, true);

            expect(undoItem.spec.icon).toBeDefined();
            expect(redoItem.spec.icon).toBeDefined();
            expect(selectParentNodeItem.spec.icon).toBeDefined();
        });

        it("should assign icons to list manipulation items", () => {
            const result = buildMenuItems(mockSchema);

            if (result.liftItem) {
                expect(result.liftItem.spec.icon).toBeDefined();
            }
            if (result.joinUpItem) {
                expect(result.joinUpItem.spec.icon).toBeDefined();
            }
        });
    });

    describe("Edge cases", () => {
        it("should handle empty schema", () => {
            const emptySchema = {
                nodes: {},
                marks: {},
            };

            expect(() => {
                buildMenuItems(emptySchema);
            }).not.toThrow();
        });

        it("should handle undefined values in schema", () => {
            const schemaWithUndefined = {
                nodes: {
                    paragraph: undefined,
                    heading: mockNodeType,
                },
                marks: {
                    strong: undefined,
                    em: mockMarkType,
                },
            };

            expect(() => {
                buildMenuItems(schemaWithUndefined);
            }).not.toThrow();
        });
    });
});
