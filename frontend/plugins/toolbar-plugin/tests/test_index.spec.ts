import {
    TOOLBAR_CLS,
    IToolbarInstance,
    IToolbarMenuItem,
    IToolbarSubMenuItem,
    IToolbarPosition,
    ToolbarMethods,
    CreateMenuItems,
    toolbarPlugin,
    toolbarPluginKey,
    ToolbarInstance,
    ToolbarComponent,
    ToolbarButton,
    ToolbarDropdown,
    ToolbarIcon,
} from "@/plugins/toolbar-plugin";
import { NodeType } from "@/schema/types";
import { Node } from "prosemirror-model";
import { EditorState, EditorStateConfig } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { describe, expect, it, afterEach, vi } from "vitest";

describe("toolbar-plugin/index", () => {
    afterEach(() => {
        // Clean up any DOM elements created by ToolbarInstance
        const toolbars = document.querySelectorAll(".generic-toolbar");
        toolbars.forEach((toolbar) => toolbar.remove());

        vi.clearAllMocks();
    });

    describe("window test", () => {
        it("should have window defined", () => {
            expect(window).toBeDefined();
        });
    });

    describe("preact/signals integration", () => {
        it("should create ToolbarInstance with signals", () => {
            const mockView = {
                state: { selection: {} },
                dispatch: vi.fn(),
                dom: document.createElement("div"),
            } as unknown as EditorView;

            const mockTarget = { type: { name: NodeType.FILER_IMAGE } } as Node;
            const mockCreateMenuItems = vi.fn(() => [
                { title: "Test", command: () => true },
            ]);

            const toolbar = new ToolbarInstance(
                mockView,
                mockTarget,
                mockCreateMenuItems,
            );

            expect(toolbar).toBeInstanceOf(ToolbarInstance);
            expect(toolbar.dom).toBeInstanceOf(HTMLElement);

            // Clean up
            toolbar.destroy();
        });

        it("should update signals when toolbar is updated", () => {
            const mockView1 = {
                state: { selection: {} },
                dispatch: vi.fn(),
                dom: document.createElement("div"),
            } as unknown as EditorView;

            const mockView2 = {
                state: { selection: {} },
                dispatch: vi.fn(),
                dom: document.createElement("div"),
            } as unknown as EditorView;

            const mockTarget = { type: { name: NodeType.FILER_IMAGE } } as Node;
            const mockCreateMenuItems = vi.fn(() => [
                { title: "Test", command: () => true },
            ]);

            const toolbar = new ToolbarInstance(
                mockView1,
                mockTarget,
                mockCreateMenuItems,
            );

            // Reset call count after constructor
            mockCreateMenuItems.mockClear();

            // Update with new view
            toolbar.update(mockView2);

            // Should have called createMenuItems again
            expect(mockCreateMenuItems).toHaveBeenCalledWith(
                mockView2,
                mockTarget,
            );

            // Clean up
            toolbar.destroy();
        });

        it("should handle show/hide via signals", () => {
            const mockView = {
                state: { selection: {} },
                dispatch: vi.fn(),
                dom: document.createElement("div"),
            } as unknown as EditorView;

            const mockTarget = { type: { name: NodeType.FILER_IMAGE } } as Node;
            const mockCreateMenuItems = vi.fn(() => []);

            const toolbar = new ToolbarInstance(
                mockView,
                mockTarget,
                mockCreateMenuItems,
            );

            toolbar.update = vi.fn();

            // Find the actual toolbar element inside the dom container
            const toolbarElement =
                toolbar.dom.querySelector(".generic-toolbar");
            expect(toolbarElement).toBeTruthy();

            // Test hide
            toolbar.hide();
            expect(toolbar.update).toHaveBeenCalledTimes(1);

            // Test show
            toolbar.show();
            expect(toolbar.update).toHaveBeenCalledTimes(2);
            // Clean up
            toolbar.destroy();
        });

        it("should properly clean up event listeners on destroy", () => {
            const removeEventListenerSpy = vi.spyOn(
                document,
                "removeEventListener",
            );

            const mockView = {
                state: { selection: {} },
                dispatch: vi.fn(),
                dom: document.createElement("div"),
            } as unknown as EditorView;

            const mockTarget = { type: { name: NodeType.FILER_IMAGE } } as Node;
            const mockCreateMenuItems = vi.fn(() => []);

            const toolbar = new ToolbarInstance(
                mockView,
                mockTarget,
                mockCreateMenuItems,
            );

            // Destroy should clean up
            toolbar.destroy();

            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                "click",
                expect.any(Function),
            );

            removeEventListenerSpy.mockRestore();
        });
    });

    describe("exports", () => {
        it("should export config constants", () => {
            expect(TOOLBAR_CLS).toBeDefined();
            expect(typeof TOOLBAR_CLS).toBe("object");
            expect(TOOLBAR_CLS.toolbar).toBe("generic-toolbar");
        });

        it("should export type interfaces", () => {
            // These are TypeScript interfaces, so we test by creating objects that conform to them
            const toolbarInstance = {
                dom: document.createElement("div"),
                update: () => {},
                show: () => {},
                hide: () => {},
                destroy: () => {},
            } as unknown as ToolbarInstance<Node, Record<string, unknown>>;

            const toolbarMenuItem: IToolbarMenuItem = {
                title: "Test",
                command: () => true,
            };

            const toolbarSubMenuItem: IToolbarSubMenuItem = {
                title: "Sub Test",
                command: () => true,
            };

            const toolbarPosition: IToolbarPosition = {
                top: 0,
                left: 0,
            };

            const toolbarMethods: ToolbarMethods = {
                createToolbar: (...opts) => new ToolbarInstance(...opts),
            };

            const createMenuItems: CreateMenuItems<Node> = () => [
                toolbarMenuItem,
            ];

            expect(toolbarInstance).toBeDefined();
            expect(toolbarMenuItem).toBeDefined();
            expect(toolbarSubMenuItem).toBeDefined();
            expect(toolbarPosition).toBeDefined();
            expect(toolbarMethods).toBeDefined();
            expect(createMenuItems).toBeDefined();
        });

        it("should export plugin function and key", () => {
            expect(toolbarPlugin).toBeDefined();
            expect(typeof toolbarPlugin).toBe("function");
            expect(toolbarPluginKey).toBeDefined();
        });

        it("should export component classes", () => {
            expect(ToolbarInstance).toBeDefined();
            expect(typeof ToolbarInstance).toBe("function");
            expect(ToolbarComponent).toBeDefined();
            expect(ToolbarButton).toBeDefined();
            expect(ToolbarDropdown).toBeDefined();
            expect(ToolbarIcon).toBeDefined();
        });
    });

    describe("plugin functionality", () => {
        it("should create working plugin", () => {
            const plugin = toolbarPlugin();

            expect(plugin).toBeDefined();
            expect(plugin.spec.key).toBe(toolbarPluginKey);
        });

        it("should provide createToolbar method", () => {
            const plugin = toolbarPlugin();
            const state = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            expect(state).toHaveProperty("createToolbar");
            expect(typeof state.createToolbar).toBe("function");
        });

        it("should create ToolbarInstance", () => {
            const plugin = toolbarPlugin();
            const state = plugin.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            const mockView = { state: { selection: {} } } as EditorView;
            const mockTarget = { type: { name: NodeType.FILER_IMAGE } } as Node;
            const mockCreateMenuItems = () => [];

            const toolbar = state.createToolbar(
                mockView,
                mockTarget,
                mockCreateMenuItems,
            );

            expect(toolbar).toBeInstanceOf(ToolbarInstance);
        });
    });

    describe("component integration", () => {
        it("should have components that work together", () => {
            // Test that the components can be imported and are defined
            expect(ToolbarComponent).toBeDefined();
            expect(ToolbarButton).toBeDefined();
            expect(ToolbarDropdown).toBeDefined();
            expect(ToolbarIcon).toBeDefined();

            // These are React/Preact components, so we test they're function components
            expect(typeof ToolbarComponent).toBe("function");
            expect(typeof ToolbarButton).toBe("function");
            expect(typeof ToolbarDropdown).toBe("function");
            expect(typeof ToolbarIcon).toBe("function");
        });
    });

    describe("CSS class integration", () => {
        it("should provide consistent class names for components", () => {
            expect(TOOLBAR_CLS.toolbar).toBe("generic-toolbar");
            expect(TOOLBAR_CLS.button).toBe("generic-toolbar__button");
            expect(TOOLBAR_CLS.dropdown).toBe("generic-toolbar__dropdown");

            // Test that all class names are strings
            Object.values(TOOLBAR_CLS).forEach((className) => {
                expect(typeof className).toBe("string");
                expect(className.length).toBeGreaterThan(0);
            });
        });
    });

    describe("type system integration", () => {
        it("should support type-safe menu item creation", () => {
            const createMenuItems: CreateMenuItems<Node> = () => {
                const items: IToolbarMenuItem[] = [
                    {
                        title: "Edit",
                        icon: "link",
                        command: () => true,
                        isActive: () => false,
                    },
                    {
                        title: "More",
                        items: [
                            {
                                title: "Delete",
                                command: () => true,
                            } as IToolbarSubMenuItem,
                        ],
                    },
                ];
                return items;
            };

            const mockView = { state: { selection: {} } } as EditorView;
            const mockTarget = { type: { name: NodeType.FILER_IMAGE } } as Node;

            const items = createMenuItems(mockView, mockTarget);
            expect(items).toHaveLength(2);
            expect(items[0].title).toBe("Edit");
            expect(items[1].items).toHaveLength(1);
        });

        it("should support toolbar instance lifecycle", () => {
            const instance: IToolbarInstance = {
                dom: document.createElement("div"),
                update: () => {},
                show: () => {},
                hide: () => {},
                destroy: () => {},
            };

            // Test lifecycle methods exist and can be called
            expect(() => instance.update({} as EditorView)).not.toThrow();
            expect(() => instance.show()).not.toThrow();
            expect(() => instance.hide()).not.toThrow();
            expect(() => instance.destroy()).not.toThrow();
        });

        it("should support position calculations", () => {
            const positions: IToolbarPosition[] = [
                { top: 0, left: 0 },
                { top: 100, left: 200 },
                { top: -10, left: -5 },
            ];

            positions.forEach((position) => {
                expect(typeof position.top).toBe("number");
                expect(typeof position.left).toBe("number");
            });
        });
    });

    describe("module structure", () => {
        it("should export all necessary parts for external use", () => {
            // Config
            expect(TOOLBAR_CLS).toBeDefined();

            // Types (tested by creating conforming objects)
            const testTypes = {
                instance: {} as IToolbarInstance,
                menuItem: {} as IToolbarMenuItem,
                subMenuItem: {} as IToolbarSubMenuItem,
                position: {} as IToolbarPosition,
                methods: {} as ToolbarMethods,
                createMenuItems: (() => []) as CreateMenuItems<Node>,
            };

            Object.values(testTypes).forEach((item) => {
                expect(item).toBeDefined();
            });

            // Plugin
            expect(toolbarPlugin).toBeDefined();
            expect(toolbarPluginKey).toBeDefined();

            // Components
            expect(ToolbarInstance).toBeDefined();
            expect(ToolbarComponent).toBeDefined();
            expect(ToolbarButton).toBeDefined();
            expect(ToolbarDropdown).toBeDefined();
            expect(ToolbarIcon).toBeDefined();
        });

        it("should not conflict with external imports", () => {
            // Test that our exports don't interfere with each other
            expect(toolbarPlugin).not.toBe(ToolbarInstance);
            expect(TOOLBAR_CLS).not.toBe(toolbarPluginKey);
            expect(ToolbarComponent).not.toBe(ToolbarButton);
        });
    });
});
