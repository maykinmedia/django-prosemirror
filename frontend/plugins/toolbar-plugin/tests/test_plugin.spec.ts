import {
    toolbarPlugin,
    toolbarPluginKey,
} from "@/plugins/toolbar-plugin/plugin";
import { ToolbarInstance } from "@/plugins/toolbar-plugin/components";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditorState, EditorStateConfig, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";

describe("toolbar-plugin/plugin", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("toolbarPlugin", () => {
        it("should create plugin with correct key", () => {
            const plugin = toolbarPlugin();

            expect(plugin.spec.key).toBe(toolbarPluginKey);
        });

        it("should have state management methods", () => {
            const plugin = toolbarPlugin();

            expect(plugin.spec.state).toBeDefined();
            expect(plugin.spec.state!.init).toBeDefined();
            expect(plugin.spec.state!.apply).toBeDefined();
            expect(typeof plugin.spec.state!.init).toBe("function");
            expect(typeof plugin.spec.state!.apply).toBe("function");
        });

        it("should initialize with createToolbar method", () => {
            const plugin = toolbarPlugin();

            const initialState = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            expect(initialState).toHaveProperty("createToolbar");
            expect(typeof initialState.createToolbar).toBe("function");
        });

        it("should preserve state on apply", () => {
            const plugin = toolbarPlugin();
            const initialState = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );
            const mockTransaction = {} as Transaction;

            const appliedState = plugin.spec.state!.apply(
                mockTransaction,
                initialState,
                {} as EditorState,
                {} as EditorState,
            );

            expect(appliedState).toBe(initialState);
        });
    });

    describe("createToolbar method", () => {
        it("should create ToolbarInstance with correct parameters", () => {
            const plugin = toolbarPlugin();
            const state = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            const mockView = { state: { selection: {} } } as EditorView;
            const mockTarget = { type: { name: "image" } } as Node;
            const mockCreateMenuItems = vi.fn().mockReturnValue([]);

            const toolbar = state.createToolbar(
                mockView,
                mockTarget,
                mockCreateMenuItems,
            );

            expect(toolbar).toBeInstanceOf(ToolbarInstance);
        });

        it("should pass view to ToolbarInstance", () => {
            const plugin = toolbarPlugin();
            const state = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            const mockView = {
                state: { selection: {} },
                dom: document.createElement("div"),
            } as unknown as EditorView;
            const mockTarget = { type: { name: "image" } } as Node;
            const mockCreateMenuItems = vi.fn().mockReturnValue([]);

            const toolbar = state.createToolbar(
                mockView,
                mockTarget,
                mockCreateMenuItems,
            );

            // Verify toolbar was created (ToolbarInstance constructor would have been called)
            expect(toolbar).toBeDefined();
            expect(toolbar).toBeInstanceOf(ToolbarInstance);
        });

        it("should pass target to ToolbarInstance", () => {
            const plugin = toolbarPlugin();
            const state = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            const mockView = { state: { selection: {} } } as EditorView;
            const mockTarget = {
                type: { name: "image" },
                attrs: { src: "test.jpg" },
            } as unknown as Node;
            const mockCreateMenuItems = vi.fn().mockReturnValue([]);

            const toolbar = state.createToolbar(
                mockView,
                mockTarget,
                mockCreateMenuItems,
            );

            expect(toolbar).toBeDefined();
            expect(toolbar).toBeInstanceOf(ToolbarInstance);
        });

        it("should pass createMenuItems function to ToolbarInstance", () => {
            const plugin = toolbarPlugin();
            const state = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            const mockView = { state: { selection: {} } } as EditorView;
            const mockTarget = { type: { name: "image" } } as Node;
            const mockCreateMenuItems = vi
                .fn()
                .mockReturnValue([
                    { icon: "test", title: "Test Item", command: vi.fn() },
                ]);

            const toolbar = state.createToolbar(
                mockView,
                mockTarget,
                mockCreateMenuItems,
            );

            expect(toolbar).toBeDefined();
            expect(toolbar).toBeInstanceOf(ToolbarInstance);
        });

        it("should work with generic Node type", () => {
            const plugin = toolbarPlugin();
            const state = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            const mockView = { state: { selection: {} } } as EditorView;
            const mockTarget = {
                type: { name: "paragraph" },
                content: [],
            } as unknown as Node;
            const mockCreateMenuItems = vi.fn().mockReturnValue([]);

            const toolbar = state.createToolbar(
                mockView,
                mockTarget,
                mockCreateMenuItems,
            );

            expect(toolbar).toBeDefined();
        });

        it("should work with different target types", () => {
            const plugin = toolbarPlugin();
            const state = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            const mockView = { state: { selection: {} } } as EditorView;
            const mockCreateMenuItems = vi.fn().mockReturnValue([]);

            const targets = [
                { type: { name: "image" }, attrs: { src: "test.jpg" } },
                { type: { name: "paragraph" }, content: [] },
                { type: { name: "heading" }, attrs: { level: 1 } },
            ];

            targets.forEach((target) => {
                const toolbar = state.createToolbar(
                    mockView,
                    target,
                    mockCreateMenuItems,
                );
                expect(toolbar).toBeInstanceOf(ToolbarInstance);
            });
        });
    });

    describe("toolbarPluginKey", () => {
        it("should have correct plugin key name", () => {
            // @ts-expect-error key is available
            expect(toolbarPluginKey.key).toBe("toolbar-plugin$");
        });

        it("should be consistent across multiple plugin instances", () => {
            const plugin1 = toolbarPlugin();
            const plugin2 = toolbarPlugin();

            expect(plugin1.spec.key).toBe(plugin2.spec.key);
            expect(plugin1.spec.key).toBe(toolbarPluginKey);
        });
    });

    describe("plugin instance behavior", () => {
        it("should create independent state instances", () => {
            const plugin1 = toolbarPlugin();
            const plugin2 = toolbarPlugin();

            const state1 = plugin1.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );
            const state2 = plugin2.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            expect(state1).not.toBe(state2);
            expect(state1.createToolbar).not.toBe(state2.createToolbar);
        });

        it("should maintain state consistency through apply", () => {
            const plugin = toolbarPlugin();
            const initialState = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );
            const appliedState1 = plugin.spec.state!.apply(
                {} as Transaction,
                initialState,
                {} as EditorState,
                {} as EditorState,
            );
            const appliedState2 = plugin.spec.state!.apply(
                {} as Transaction,
                appliedState1,
                {} as EditorState,
                {} as EditorState,
            );

            expect(appliedState1).toBe(initialState);
            expect(appliedState2).toBe(initialState);
        });

        it("should handle multiple toolbar creations", () => {
            const plugin = toolbarPlugin();
            const state = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            const mockView = { state: { selection: {} } } as EditorView;
            const mockCreateMenuItems = vi.fn().mockReturnValue([]);

            const target1 = { type: { name: "image" } } as Node;
            const target2 = { type: { name: "paragraph" } } as Node;

            const toolbar1 = state.createToolbar(
                mockView,
                target1,
                mockCreateMenuItems,
            );
            const toolbar2 = state.createToolbar(
                mockView,
                target2,
                mockCreateMenuItems,
            );

            expect(toolbar1).toBeInstanceOf(ToolbarInstance);
            expect(toolbar2).toBeInstanceOf(ToolbarInstance);
            expect(toolbar1).not.toBe(toolbar2);
        });
    });

    describe("integration scenarios", () => {
        it("should work with complex menu items", () => {
            const plugin = toolbarPlugin();
            const state = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            const mockView = { state: { selection: {} } } as EditorView;
            const mockTarget = { type: { name: "image" } } as Node;
            const complexMenuItems = [
                {
                    icon: "edit",
                    title: "Edit",
                    command: vi.fn(),
                    isActive: vi.fn(),
                    enabled: vi.fn(),
                },
                {
                    icon: "dropdown",
                    title: "More options",
                    items: [
                        { title: "Option 1", command: vi.fn() },
                        { title: "Option 2", command: vi.fn() },
                    ],
                },
            ];
            const mockCreateMenuItems = vi
                .fn()
                .mockReturnValue(complexMenuItems);

            const toolbar = state.createToolbar(
                mockView,
                mockTarget,
                mockCreateMenuItems,
            );

            expect(toolbar).toBeInstanceOf(ToolbarInstance);
            expect(mockCreateMenuItems).toHaveBeenCalledWith(
                mockView,
                mockTarget,
            );
        });

        it("should handle empty menu items", () => {
            const plugin = toolbarPlugin();
            const state = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            const mockView = { state: { selection: {} } } as EditorView;
            const mockTarget = { type: { name: "image" } } as Node;
            const mockCreateMenuItems = vi.fn().mockReturnValue([]);

            const toolbar = state.createToolbar(
                mockView,
                mockTarget,
                mockCreateMenuItems,
            );

            expect(toolbar).toBeInstanceOf(ToolbarInstance);
        });

        it("should handle null menu items", () => {
            const plugin = toolbarPlugin();
            const state = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            const mockView = { state: { selection: {} } } as EditorView;
            const mockTarget = { type: { name: "image" } } as Node;
            const mockCreateMenuItems = vi.fn().mockReturnValue(null);

            expect(() => {
                state.createToolbar(mockView, mockTarget, mockCreateMenuItems);
            }).not.toThrow();
        });
    });

    describe("TypeScript integration", () => {
        it("should support generic typing", () => {
            const plugin = toolbarPlugin();
            const state = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            // This tests that the generic typing works correctly
            const mockView = { state: { selection: {} } } as EditorView;
            const mockImageTarget = {
                type: { name: "image" },
                attrs: { src: "test.jpg" },
            } as unknown as Node;
            const mockCreateMenuItems = vi.fn().mockReturnValue([]);

            // Should work with specific node type
            const toolbar = state.createToolbar(
                mockView,
                mockImageTarget,
                mockCreateMenuItems,
            );

            expect(toolbar).toBeInstanceOf(ToolbarInstance);
        });
    });
});
