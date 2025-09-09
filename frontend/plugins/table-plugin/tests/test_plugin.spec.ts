import {
    tableToolbarPlugin,
    tableToolbarKey,
} from "@/plugins/table-plugin/plugin";
import { CreateMenuItems, IToolbarInstance } from "@/plugins/toolbar-plugin";
import * as utils from "@/utils";
import { Node } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { tableToolbarMenuConfig } from "../config";

// Mock the utils

describe("table-toolbar-plugin/plugin", () => {
    let mockView: EditorView;
    let mockConfig: CreateMenuItems<Node>;
    let mockCreateToolbar1: Mock;
    let mockToolbarInstance: IToolbarInstance;

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mock("@/utils", () => ({
            getSelectedTableNode: vi.fn(),
            isInsideTable: vi.fn(),
            isImageSelected: vi.fn(),
        }));

        // Mock toolbar instance
        mockToolbarInstance = {
            dom: document.createElement("div"),
            update: vi.fn(),
            show: vi.fn(),
            hide: vi.fn(),
            destroy: vi.fn(),
        };

        // Mock createToolbar function
        mockCreateToolbar1 = vi.fn().mockReturnValue(mockToolbarInstance);

        // Mock view with toolbar plugin state
        mockView = {
            state: {
                selection: { eq: vi.fn().mockReturnValue(false) },
                [`toolbar-plugin$`]: {
                    createToolbar: mockCreateToolbar1,
                },
            },
            dispatch: vi.fn(),
        } as unknown as EditorView;

        // Mock config function
        mockConfig = vi.fn().mockReturnValue([
            {
                icon: "link",
                title: "Edit table",
                command: vi.fn(),
            },
        ]);
    });

    describe("tableToolbarPlugin", () => {
        it("should create plugin with correct key", () => {
            const plugin = tableToolbarPlugin(tableToolbarMenuConfig);

            expect(plugin.spec.key).toBe(tableToolbarKey);
        });

        it("should return plugin with view method", () => {
            const plugin = tableToolbarPlugin(mockConfig);

            expect(plugin.spec.view).toBeDefined();
            expect(typeof plugin.spec.view).toBe("function");
        });
    });

    describe("plugin view", () => {
        it("should return view object with update and destroy methods", () => {
            const plugin = tableToolbarPlugin(tableToolbarMenuConfig);
            const view = plugin.spec.view!(mockView);

            expect(view).toHaveProperty("update");
            expect(view).toHaveProperty("destroy");
            expect(typeof view.update).toBe("function");
            expect(typeof view.destroy).toBe("function");
        });

        describe("update method", () => {
            it("should do nothing when createToolbar is not available", () => {
                const mockViewWithoutToolbar = {
                    ...mockView,
                    state: {
                        selection: { eq: vi.fn().mockReturnValue(false) },
                    },
                } as unknown as EditorView;

                const plugin = tableToolbarPlugin(tableToolbarMenuConfig);
                const view = plugin.spec.view!(mockView);

                vi.mocked(utils.isInsideTable).mockReturnValue(true);
                vi.mocked(utils.getSelectedTableNode).mockReturnValue(
                    {} as Node,
                );

                view.update!(
                    mockViewWithoutToolbar,
                    null as unknown as EditorState,
                );

                expect(mockCreateToolbar1).not.toHaveBeenCalled();
            });

            it("should do nothing when selection hasn't changed", () => {
                const mockPrevState = { selection: mockView.state.selection };
                mockView.state.selection.eq = vi.fn().mockReturnValue(true);

                const plugin = tableToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                view.update!(mockView, mockPrevState as unknown as EditorState);

                expect(utils.isInsideTable).not.toHaveBeenCalled();
                expect(mockCreateToolbar1).not.toHaveBeenCalled();
            });

            it("should create toolbar when table is selected", () => {
                const mockTableNode = {
                    type: { name: "table" },
                } as unknown as Node;

                vi.mocked(utils.isInsideTable).mockReturnValue(true);
                vi.mocked(utils.getSelectedTableNode).mockReturnValue(
                    mockTableNode,
                );

                const plugin = tableToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                view.update!(mockView, null as unknown as EditorState);

                expect(utils.isInsideTable).toHaveBeenCalledWith(mockView);
                expect(utils.getSelectedTableNode).toHaveBeenCalledWith(
                    mockView,
                );
                expect(mockCreateToolbar1).toHaveBeenCalledWith(
                    mockView,
                    mockTableNode,
                    mockConfig,
                    expect.any(Function),
                    "table-toolbar",
                );
            });

            it("should not create toolbar when no table is selected", () => {
                vi.mocked(utils.isInsideTable).mockReturnValue(false);
                vi.mocked(utils.getSelectedTableNode).mockReturnValue(null);

                const plugin = tableToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                view.update!(mockView, null as unknown as EditorState);

                expect(utils.isInsideTable).toHaveBeenCalledWith(mockView);
                expect(utils.getSelectedTableNode).toHaveBeenCalledWith(
                    mockView,
                );
                expect(mockCreateToolbar1).not.toHaveBeenCalled();
            });

            it("should destroy existing toolbar before creating new one", () => {
                const mockImageNode = {
                    type: { name: "table" },
                    attrs: { src: "test.jpg" },
                } as unknown as Node;

                vi.mocked(utils.isInsideTable).mockReturnValue(true);
                vi.mocked(utils.getSelectedTableNode).mockReturnValue(
                    mockImageNode,
                );

                const plugin = tableToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                // First update creates toolbar
                view.update!(mockView, null as unknown as EditorState);
                expect(mockCreateToolbar1).toHaveBeenCalledTimes(1);
                expect(mockToolbarInstance.destroy).not.toHaveBeenCalled();

                // Second update should destroy first toolbar and create new one
                view.update!(mockView, null as unknown as EditorState);
                expect(mockToolbarInstance.destroy).toHaveBeenCalledTimes(1);
                expect(mockCreateToolbar1).toHaveBeenCalledTimes(2);
            });

            it("should destroy toolbar when table is deselected", () => {
                const mockImageNode = {
                    type: { name: "table" },
                    attrs: { src: "test.jpg" },
                } as unknown as Node;

                // First call - table selected
                vi.mocked(utils.isInsideTable).mockReturnValue(true);
                vi.mocked(utils.getSelectedTableNode).mockReturnValue(
                    mockImageNode,
                );

                const plugin = tableToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                view.update!(mockView, null as unknown as EditorState);
                expect(mockCreateToolbar1).toHaveBeenCalledTimes(1);

                // Second call - table deselected
                vi.mocked(utils.isInsideTable).mockReturnValue(false);
                vi.mocked(utils.getSelectedTableNode).mockReturnValue(null);

                view.update!(mockView, null as unknown as EditorState);
                expect(mockToolbarInstance.destroy).toHaveBeenCalledTimes(1);
            });

            it("should handle missing table node gracefully", () => {
                vi.mocked(utils.isInsideTable).mockReturnValue(true);
                vi.mocked(utils.getSelectedTableNode).mockReturnValue(null);

                const plugin = tableToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                expect(() =>
                    view.update!(mockView, null as unknown as EditorState),
                ).not.toThrow();
                expect(mockCreateToolbar1).not.toHaveBeenCalled();
            });

            it("should throw and catch an error if the toolbar can't be created", () => {
                const mockImageNode = {
                    type: { name: "table" },
                    attrs: { src: "test.jpg" },
                } as unknown as Node;

                vi.mocked(utils.isInsideTable).mockReturnValue(true);
                vi.mocked(utils.getSelectedTableNode).mockReturnValue(
                    mockImageNode,
                );

                // Mock createToolbar to throw an error
                mockCreateToolbar1.mockImplementationOnce(() => {
                    throw new Error("Toolbar creation failed");
                });

                const consoleErrorSpy = vi
                    .spyOn(console, "error")
                    .mockImplementation(() => {});

                const plugin = tableToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                // Should not throw, but should catch the error internally
                expect(() =>
                    view.update!(mockView, null as unknown as EditorState),
                ).not.toThrow();

                // Should log the error
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Could not create image toolbar:",
                    expect.any(Error),
                );

                consoleErrorSpy.mockRestore();
            });
        });

        describe("destroy method", () => {
            it("should destroy toolbar instance when view is destroyed", () => {
                const mockImageNode = {
                    type: { name: "table" },
                    attrs: { src: "test.jpg" },
                } as unknown as Node;

                vi.mocked(utils.isInsideTable).mockReturnValue(true);
                vi.mocked(utils.getSelectedTableNode).mockReturnValue(
                    mockImageNode,
                );

                const plugin = tableToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                // Create toolbar first
                view.update!(mockView, null as unknown as EditorState);
                expect(mockCreateToolbar1).toHaveBeenCalled();

                // Destroy view
                view.destroy!();
                expect(mockToolbarInstance.destroy).toHaveBeenCalledTimes(1);
            });

            it("should handle destroy when no toolbar exists", () => {
                const plugin = tableToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                expect(() => view.destroy!()).not.toThrow();
                expect(mockToolbarInstance.destroy).not.toHaveBeenCalled();
            });
        });
    });

    describe("plugin integration", () => {
        it("should work with different config functions", () => {
            const altConfig: CreateMenuItems<Node> = vi.fn().mockReturnValue([
                { icon: "table", title: "Replace table", command: vi.fn() },
                { icon: "delete", title: "Delete table", command: vi.fn() },
            ]);

            const plugin = tableToolbarPlugin(altConfig);
            const view = plugin.spec.view!(mockView);

            const mockImageNode = {
                type: { name: "table" },
                attrs: { src: "test.jpg" },
            } as unknown as Node;
            vi.mocked(utils.isInsideTable).mockReturnValue(true);
            vi.mocked(utils.getSelectedTableNode).mockReturnValue(
                mockImageNode,
            );

            view.update!(mockView, null as unknown as EditorState);

            expect(mockCreateToolbar1).toHaveBeenCalledWith(
                mockView,
                mockImageNode,
                altConfig,
                expect.any(Function),
                "table-toolbar",
            );
        });

        it("should handle multiple selection changes", () => {
            const mockImageNode1 = {
                type: { name: "table" },
                attrs: { src: "test1.jpg" },
            } as unknown as Node;
            const mockImageNode2 = {
                type: { name: "table" },
                attrs: { src: "test2.jpg" },
            } as unknown as Node;

            const plugin = tableToolbarPlugin(mockConfig);
            const view = plugin.spec.view!(mockView);

            // Select first table
            vi.mocked(utils.isInsideTable).mockReturnValue(true);
            vi.mocked(utils.getSelectedTableNode)
                .mockReturnValueOnce(mockImageNode1)
                .mockReturnValueOnce(mockImageNode2); // Setup both calls

            view.update!(mockView, null as unknown as EditorState);

            expect(mockCreateToolbar1).toHaveBeenCalledWith(
                mockView,
                mockImageNode1,
                mockConfig,
                expect.any(Function),
                "table-toolbar",
            );
            expect(mockCreateToolbar1).toHaveBeenCalledTimes(1);

            // Select second table
            view.update!(mockView, null as unknown as EditorState);

            expect(mockToolbarInstance.destroy).toHaveBeenCalledTimes(1);
            expect(mockCreateToolbar1).toHaveBeenCalledWith(
                mockView,
                mockImageNode2,
                mockConfig,
                expect.any(Function),
                "table-toolbar",
            );
            expect(mockCreateToolbar1).toHaveBeenCalledTimes(2);

            // Deselect
            vi.mocked(utils.isInsideTable).mockReturnValue(false);
            vi.mocked(utils.getSelectedTableNode).mockReturnValue(null);
            view.update!(mockView, null as unknown as EditorState);

            expect(mockToolbarInstance.destroy).toHaveBeenCalledTimes(2);
        });
    });
});
