import {
    imageToolbarPlugin,
    imageToolbarKey,
} from "@/plugins/image-toolbar-plugin";
import { CreateMenuItems, IToolbarInstance } from "@/plugins/toolbar-plugin";
import { ImageDOMAttrs } from "@/schema/nodes/image";
import { NodeType } from "@/schema/types";
import * as utils from "@/utils";
import { Node } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

// Mock the utils
vi.mock("@/utils", () => ({
    getSelectedImageNode: vi.fn(),
    isImageSelected: vi.fn(),
}));

describe("image-toolbar-plugin/plugin", () => {
    let mockView: EditorView;
    let mockConfig: CreateMenuItems<Node, ImageDOMAttrs>;
    let mockCreateToolbar: Mock;
    let mockToolbarInstance: IToolbarInstance;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock toolbar instance
        mockToolbarInstance = {
            dom: document.createElement("div"),
            update: vi.fn(),
            show: vi.fn(),
            hide: vi.fn(),
            destroy: vi.fn(),
        };

        // Mock createToolbar function
        mockCreateToolbar = vi.fn().mockReturnValue(mockToolbarInstance);

        // Mock view with toolbar plugin state
        mockView = {
            state: {
                selection: { eq: vi.fn().mockReturnValue(false) },
                [`toolbar-plugin$`]: {
                    createToolbar: mockCreateToolbar,
                },
            },
            dispatch: vi.fn(),
        } as unknown as EditorView;

        // Mock config function
        mockConfig = vi.fn().mockReturnValue([
            {
                icon: "link",
                title: "Edit image",
                command: vi.fn(),
            },
        ]);
    });

    describe("imageToolbarPlugin", () => {
        it("should create plugin with correct key", () => {
            const plugin = imageToolbarPlugin(mockConfig);

            expect(plugin.spec.key).toBe(imageToolbarKey);
        });

        it("should return plugin with view method", () => {
            const plugin = imageToolbarPlugin(mockConfig);

            expect(plugin.spec.view).toBeDefined();
            expect(typeof plugin.spec.view).toBe("function");
        });
    });

    describe("plugin view", () => {
        it("should return view object with update and destroy methods", () => {
            const plugin = imageToolbarPlugin(mockConfig);
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

                const plugin = imageToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                vi.mocked(utils.isImageSelected).mockReturnValue(true);
                vi.mocked(utils.getSelectedImageNode).mockReturnValue(
                    {} as Node,
                );

                view.update!(
                    mockViewWithoutToolbar,
                    null as unknown as EditorState,
                );

                expect(mockCreateToolbar).not.toHaveBeenCalled();
            });

            it("should do nothing when selection hasn't changed", () => {
                const mockPrevState = { selection: mockView.state.selection };
                mockView.state.selection.eq = vi.fn().mockReturnValue(true);

                const plugin = imageToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                view.update!(mockView, mockPrevState as unknown as EditorState);

                expect(utils.isImageSelected).not.toHaveBeenCalled();
                expect(mockCreateToolbar).not.toHaveBeenCalled();
            });

            it("should create toolbar when image is selected", () => {
                const mockImageNode = {
                    type: { name: NodeType.FILER_IMAGE },
                    attrs: { src: "test.jpg" },
                } as unknown as Node;

                vi.mocked(utils.isImageSelected).mockReturnValue(true);
                vi.mocked(utils.getSelectedImageNode).mockReturnValue(
                    mockImageNode,
                );

                const plugin = imageToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                view.update!(mockView, null as unknown as EditorState);

                expect(utils.isImageSelected).toHaveBeenCalledWith(mockView);
                expect(utils.getSelectedImageNode).toHaveBeenCalledWith(
                    mockView,
                );
                expect(mockCreateToolbar).toHaveBeenCalledWith(
                    mockView,
                    mockImageNode,
                    mockConfig,
                    expect.any(Function),
                    "image-toolbar",
                );
            });

            it("should not create toolbar when no image is selected", () => {
                vi.mocked(utils.isImageSelected).mockReturnValue(false);
                vi.mocked(utils.getSelectedImageNode).mockReturnValue(null);

                const plugin = imageToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                view.update!(mockView, null as unknown as EditorState);

                expect(utils.isImageSelected).toHaveBeenCalledWith(mockView);
                expect(utils.getSelectedImageNode).toHaveBeenCalledWith(
                    mockView,
                );
                expect(mockCreateToolbar).not.toHaveBeenCalled();
            });

            it("should destroy existing toolbar before creating new one", () => {
                const mockImageNode = {
                    type: { name: NodeType.FILER_IMAGE },
                    attrs: { src: "test.jpg" },
                } as unknown as Node;

                vi.mocked(utils.isImageSelected).mockReturnValue(true);
                vi.mocked(utils.getSelectedImageNode).mockReturnValue(
                    mockImageNode,
                );

                const plugin = imageToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                // First update creates toolbar
                view.update!(mockView, null as unknown as EditorState);
                expect(mockCreateToolbar).toHaveBeenCalledTimes(1);
                expect(mockToolbarInstance.destroy).not.toHaveBeenCalled();

                // Second update should destroy first toolbar and create new one
                view.update!(mockView, null as unknown as EditorState);
                expect(mockToolbarInstance.destroy).toHaveBeenCalledTimes(1);
                expect(mockCreateToolbar).toHaveBeenCalledTimes(2);
            });

            it("should destroy toolbar when image is deselected", () => {
                const mockImageNode = {
                    type: { name: NodeType.FILER_IMAGE },
                    attrs: { src: "test.jpg" },
                } as unknown as Node;

                // First call - image selected
                vi.mocked(utils.isImageSelected).mockReturnValue(true);
                vi.mocked(utils.getSelectedImageNode).mockReturnValue(
                    mockImageNode,
                );

                const plugin = imageToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                view.update!(mockView, null as unknown as EditorState);
                expect(mockCreateToolbar).toHaveBeenCalledTimes(1);

                // Second call - image deselected
                vi.mocked(utils.isImageSelected).mockReturnValue(false);
                vi.mocked(utils.getSelectedImageNode).mockReturnValue(null);

                view.update!(mockView, null as unknown as EditorState);
                expect(mockToolbarInstance.destroy).toHaveBeenCalledTimes(1);
            });

            it("should handle missing image node gracefully", () => {
                vi.mocked(utils.isImageSelected).mockReturnValue(true);
                vi.mocked(utils.getSelectedImageNode).mockReturnValue(null);

                const plugin = imageToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                expect(() =>
                    view.update!(mockView, null as unknown as EditorState),
                ).not.toThrow();
                expect(mockCreateToolbar).not.toHaveBeenCalled();
            });
        });

        describe("destroy method", () => {
            it("should destroy toolbar instance when view is destroyed", () => {
                const mockImageNode = {
                    type: { name: NodeType.FILER_IMAGE },
                    attrs: { src: "test.jpg" },
                } as unknown as Node;

                vi.mocked(utils.isImageSelected).mockReturnValue(true);
                vi.mocked(utils.getSelectedImageNode).mockReturnValue(
                    mockImageNode,
                );

                const plugin = imageToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                // Create toolbar first
                view.update!(mockView, null as unknown as EditorState);
                expect(mockCreateToolbar).toHaveBeenCalled();

                // Destroy view
                view.destroy!();
                expect(mockToolbarInstance.destroy).toHaveBeenCalledTimes(1);
            });

            it("should handle destroy when no toolbar exists", () => {
                const plugin = imageToolbarPlugin(mockConfig);
                const view = plugin.spec.view!(mockView);

                expect(() => view.destroy!()).not.toThrow();
                expect(mockToolbarInstance.destroy).not.toHaveBeenCalled();
            });
        });
    });

    describe("plugin integration", () => {
        it("should work with different config functions", () => {
            const altConfig: CreateMenuItems<Node, ImageDOMAttrs> = vi
                .fn()
                .mockReturnValue([
                    { icon: "image", title: "Replace image", command: vi.fn() },
                    { icon: "delete", title: "Delete image", command: vi.fn() },
                ]);

            const plugin = imageToolbarPlugin(altConfig);
            const view = plugin.spec.view!(mockView);

            const mockImageNode = {
                type: { name: NodeType.FILER_IMAGE },
                attrs: { src: "test.jpg" },
            } as unknown as Node;
            vi.mocked(utils.isImageSelected).mockReturnValue(true);
            vi.mocked(utils.getSelectedImageNode).mockReturnValue(
                mockImageNode,
            );

            view.update!(mockView, null as unknown as EditorState);

            expect(mockCreateToolbar).toHaveBeenCalledWith(
                mockView,
                mockImageNode,
                altConfig,
                expect.any(Function),
                "image-toolbar",
            );
        });

        it("should handle multiple selection changes", () => {
            const mockImageNode1 = {
                type: { name: NodeType.FILER_IMAGE },
                attrs: { src: "test1.jpg" },
            } as unknown as Node;
            const mockImageNode2 = {
                type: { name: NodeType.FILER_IMAGE },
                attrs: { src: "test2.jpg" },
            } as unknown as Node;

            const plugin = imageToolbarPlugin(mockConfig);
            const view = plugin.spec.view!(mockView);

            // Select first image
            vi.mocked(utils.isImageSelected).mockReturnValue(true);
            vi.mocked(utils.getSelectedImageNode)
                .mockReturnValueOnce(mockImageNode1)
                .mockReturnValueOnce(mockImageNode2); // Setup both calls

            view.update!(mockView, null as unknown as EditorState);

            expect(mockCreateToolbar).toHaveBeenCalledWith(
                mockView,
                mockImageNode1,
                mockConfig,
                expect.any(Function),
                "image-toolbar",
            );
            expect(mockCreateToolbar).toHaveBeenCalledTimes(1);

            // Select second image
            view.update!(mockView, null as unknown as EditorState);

            expect(mockToolbarInstance.destroy).toHaveBeenCalledTimes(1);
            expect(mockCreateToolbar).toHaveBeenCalledWith(
                mockView,
                mockImageNode2,
                mockConfig,
                expect.any(Function),
                "image-toolbar",
            );
            expect(mockCreateToolbar).toHaveBeenCalledTimes(2);

            // Deselect
            vi.mocked(utils.isImageSelected).mockReturnValue(false);
            vi.mocked(utils.getSelectedImageNode).mockReturnValue(null);
            view.update!(mockView, null as unknown as EditorState);

            expect(mockToolbarInstance.destroy).toHaveBeenCalledTimes(2);
        });
    });
});
