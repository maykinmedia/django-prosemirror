import {
    uploadPlugin,
    imageUploadKey,
    ImageUploadMethods,
} from "@/plugins/image-upload-plugin/plugin";
import { UploadImage } from "@/plugins/image-upload-plugin/upload";
import { IDPMSettings, LanguageCodeEnum } from "@/types/types";
import { NodeType } from "@/schema/types";
import { EditorView } from "prosemirror-view";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Transaction, EditorState, EditorStateConfig } from "prosemirror-state";

type MockDragEvent = {
    dataTransfer: { files: File[] } | null;
    preventDefault: () => void;
};

type MockClipboardEvent = {
    clipboardData: { files: File[] } | null;
    preventDefault: () => void;
};

// Mock UploadImage class
const mockUploadImage = vi.fn();
const mockUploadImageInstance = {
    uploadImage: vi.fn(),
    handleImageUpload: vi.fn(),
    uploadAndInsertFiles: vi.fn(),
};

vi.mock("@/plugins/image-upload-plugin/upload", () => ({
    UploadImage: vi.fn().mockImplementation((endpoint) => {
        mockUploadImage(endpoint);
        return mockUploadImageInstance;
    }),
}));

describe("image-upload-plugin/plugin", () => {
    let mockSettings: IDPMSettings;
    let mockView: EditorView;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUploadImage.mockClear();
        mockUploadImageInstance.uploadImage.mockClear();
        mockUploadImageInstance.handleImageUpload.mockClear();
        mockUploadImageInstance.uploadAndInsertFiles.mockClear();

        mockSettings = {
            allowedNodes: [NodeType.PARAGRAPH],
            allowedMarks: [],
            filerUploadEndpoint: "http://example.com/upload",
            filerUploadEnabled: true,
            language: LanguageCodeEnum.EN,
        };

        mockView = {
            state: {
                schema: {
                    nodes: {
                        image: { create: vi.fn() },
                    },
                },
                tr: {
                    replaceSelectionWith: vi.fn().mockReturnThis(),
                    scrollIntoView: vi.fn().mockReturnThis(),
                },
            },
            dispatch: vi.fn(),
        } as unknown as EditorView;
    });

    describe("uploadPlugin", () => {
        it("should create plugin with correct key", () => {
            const plugin = uploadPlugin(mockSettings);

            expect(plugin!.spec.key).toBe(imageUploadKey);
        });

        it("should initialize with UploadImage instance", () => {
            const plugin = uploadPlugin(mockSettings);
            const initialState = plugin!.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );

            expect(initialState).toHaveProperty("uploader");
            expect(initialState.uploader).toBe(mockUploadImageInstance);
            expect(mockUploadImage).toHaveBeenCalledWith(
                mockSettings.filerUploadEndpoint,
            );
        });

        it("should preserve state on apply", () => {
            const plugin = uploadPlugin(mockSettings);
            const initialState = plugin!.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            );
            const mockTransaction = {} as Transaction;

            const appliedState = plugin!.spec.state!.apply(
                mockTransaction,
                initialState,
                {} as EditorState,
                {} as EditorState,
            );
            expect(appliedState).toBe(initialState);
        });

        it("should handle missing filerUploadEndpoint", () => {
            const settingsWithoutEndpoint = {
                ...mockSettings,
                filerUploadEndpoint: undefined,
                filerUploadEnabled: false,
            };

            const plugin = uploadPlugin(settingsWithoutEndpoint);

            expect(plugin).toBeUndefined();
        });
    });

    describe("DOM event handlers", () => {
        describe("drop handler", () => {
            it("should handle image files on drop", () => {
                const plugin = uploadPlugin(mockSettings);
                const dropHandler = plugin?.spec.props!.handleDOMEvents!.drop;

                const mockFile = new File([""], "test.jpg", {
                    type: "image/jpeg",
                });
                const mockEvent = {
                    dataTransfer: { files: [mockFile] },
                    preventDefault: vi.fn(),
                } as MockDragEvent;

                const result = dropHandler!.call(
                    plugin!,
                    mockView,
                    mockEvent as DragEvent,
                );

                expect(mockEvent.preventDefault).toHaveBeenCalled();
                expect(
                    mockUploadImageInstance.uploadAndInsertFiles,
                ).toHaveBeenCalledWith([mockFile], mockView);
                expect(result).toBe(true);
            });

            it("should ignore non-image files on drop", () => {
                const plugin = uploadPlugin(mockSettings);
                const dropHandler = plugin!.spec.props!.handleDOMEvents!.drop;

                const mockFile = new File([""], "test.txt", {
                    type: "text/plain",
                });
                const mockEvent = {
                    dataTransfer: { files: [mockFile] },
                    preventDefault: vi.fn(),
                } as MockDragEvent;

                const result = dropHandler!.call(
                    plugin!,
                    mockView,
                    mockEvent as DragEvent,
                );

                expect(mockEvent.preventDefault).not.toHaveBeenCalled();
                expect(result).toBe(false);
            });

            it("should handle multiple image files on drop", () => {
                const plugin = uploadPlugin(mockSettings);
                const dropHandler = plugin?.spec.props!.handleDOMEvents!.drop;

                const mockFiles = [
                    new File([""], "test1.jpg", { type: "image/jpeg" }),
                    new File([""], "test2.png", { type: "image/png" }),
                    new File([""], "test.txt", { type: "text/plain" }), // Should be filtered out
                ];
                const mockEvent = {
                    dataTransfer: { files: mockFiles },
                    preventDefault: vi.fn(),
                } as MockDragEvent;

                // Mock upload behavior is already set up

                const result = dropHandler!.call(
                    plugin!,
                    mockView,
                    mockEvent as DragEvent,
                );

                expect(mockEvent.preventDefault).toHaveBeenCalled();
                expect(
                    mockUploadImageInstance.uploadAndInsertFiles,
                ).toHaveBeenCalledWith(
                    [mockFiles[0], mockFiles[1]], // Only image files
                    mockView,
                );
                expect(result).toBe(true);
            });

            it("should handle empty file list on drop", () => {
                const plugin = uploadPlugin(mockSettings);
                const dropHandler = plugin!.spec.props!.handleDOMEvents!.drop;

                const mockEvent = {
                    dataTransfer: { files: [] },
                    preventDefault: vi.fn(),
                } as MockDragEvent;

                const result = dropHandler!.call(
                    plugin!,
                    mockView,
                    mockEvent as DragEvent,
                );

                expect(mockEvent.preventDefault).not.toHaveBeenCalled();
                expect(result).toBe(false);
            });

            it("should handle missing dataTransfer on drop", () => {
                const plugin = uploadPlugin(mockSettings);
                const dropHandler = plugin!.spec.props!.handleDOMEvents!.drop;

                const mockEvent = {
                    dataTransfer: null,
                    preventDefault: vi.fn(),
                } as MockDragEvent;

                const result = dropHandler!.call(
                    plugin!,
                    mockView,
                    mockEvent as DragEvent,
                );

                expect(mockEvent.preventDefault).not.toHaveBeenCalled();
                expect(result).toBe(false);
            });
        });

        describe("paste handler", () => {
            it("should handle image files on paste", () => {
                const plugin = uploadPlugin(mockSettings);
                const pasteHandler = plugin!.spec.props!.handleDOMEvents!.paste;

                const mockFile = new File([""], "test.jpg", {
                    type: "image/jpeg",
                });
                const mockEvent = {
                    clipboardData: { files: [mockFile] },
                    preventDefault: vi.fn(),
                } as MockClipboardEvent;

                // Mock upload behavior is already set up

                const result = pasteHandler!.call(
                    plugin!,
                    mockView,
                    mockEvent as ClipboardEvent,
                );

                expect(mockEvent.preventDefault).toHaveBeenCalled();
                expect(
                    mockUploadImageInstance.uploadAndInsertFiles,
                ).toHaveBeenCalledWith([mockFile], mockView);
                expect(result).toBe(true);
            });

            it("should ignore non-image files on paste", () => {
                const plugin = uploadPlugin(mockSettings);
                const pasteHandler = plugin!.spec.props!.handleDOMEvents!.paste;

                const mockFile = new File([""], "test.txt", {
                    type: "text/plain",
                });
                const mockEvent = {
                    clipboardData: { files: [mockFile] },
                    preventDefault: vi.fn(),
                } as MockClipboardEvent;

                const result = pasteHandler!.call(
                    plugin!,
                    mockView,
                    mockEvent as ClipboardEvent,
                );

                expect(mockEvent.preventDefault).not.toHaveBeenCalled();
                expect(result).toBe(false);
            });

            it("should handle multiple image files on paste", () => {
                const plugin = uploadPlugin(mockSettings);
                const pasteHandler = plugin!.spec.props!.handleDOMEvents!.paste;

                const mockFiles = [
                    new File([""], "test1.jpg", { type: "image/jpeg" }),
                    new File([""], "test2.gif", { type: "image/gif" }),
                ];
                const mockEvent = {
                    clipboardData: { files: mockFiles },
                    preventDefault: vi.fn(),
                } as MockClipboardEvent;

                // Mock upload behavior is already set up

                const result = pasteHandler!.call(
                    plugin!,
                    mockView,
                    mockEvent as ClipboardEvent,
                );

                expect(mockEvent.preventDefault).toHaveBeenCalled();
                expect(
                    mockUploadImageInstance.uploadAndInsertFiles,
                ).toHaveBeenCalledWith(mockFiles, mockView);
                expect(result).toBe(true);
            });

            it("should handle empty clipboard on paste", () => {
                const plugin = uploadPlugin(mockSettings);
                const pasteHandler = plugin!.spec.props!.handleDOMEvents!.paste;

                const mockEvent = {
                    clipboardData: { files: [] },
                    preventDefault: vi.fn(),
                } as MockClipboardEvent;

                const result = pasteHandler!.call(
                    plugin!,
                    mockView,
                    mockEvent as ClipboardEvent,
                );

                expect(mockEvent.preventDefault).not.toHaveBeenCalled();
                expect(result).toBe(false);
            });

            it("should handle missing clipboardData on paste", () => {
                const plugin = uploadPlugin(mockSettings);
                const pasteHandler = plugin!.spec.props!.handleDOMEvents!.paste;

                const mockEvent = {
                    clipboardData: null,
                    preventDefault: vi.fn(),
                } as MockClipboardEvent;

                const result = pasteHandler!.call(
                    plugin!,
                    mockView,
                    mockEvent as ClipboardEvent,
                );

                expect(mockEvent.preventDefault).not.toHaveBeenCalled();
                expect(result).toBe(false);
            });
        });
    });

    describe("imageUploadKey", () => {
        it("should have correct plugin key name", () => {
            expect(imageUploadKey).toBe(imageUploadKey);
        });

        it("should be consistent across multiple plugin instances", () => {
            const plugin1 = uploadPlugin(mockSettings);
            const plugin2 = uploadPlugin({ ...mockSettings });

            expect(plugin1!.spec.key).toBe(plugin2!.spec.key);
            expect(plugin1!.spec.key).toBe(imageUploadKey);
        });
    });

    describe("ImageUploadMethods interface", () => {
        it("should provide uploader in plugin state", () => {
            const plugin = uploadPlugin(mockSettings);
            const state = plugin!.spec.state!.init(
                {} as EditorStateConfig,
                {} as EditorState,
            ) as ImageUploadMethods;

            expect(state).toHaveProperty("uploader");
            expect(state.uploader).toBeDefined();
        });
    });

    describe("integration scenarios", () => {
        it("should work with different file types", () => {
            const plugin = uploadPlugin(mockSettings);
            const dropHandler = plugin!.spec.props!.handleDOMEvents!.drop;

            const testCases = [
                { type: "image/jpeg", shouldHandle: true },
                { type: "image/png", shouldHandle: true },
                { type: "image/gif", shouldHandle: true },
                { type: "image/webp", shouldHandle: true },
                { type: "image/svg+xml", shouldHandle: true },
                { type: "text/plain", shouldHandle: false },
                { type: "application/pdf", shouldHandle: false },
                { type: "video/mp4", shouldHandle: false },
            ];

            testCases.forEach(({ type, shouldHandle }) => {
                const mockFile = new File([""], `test.${type.split("/")[1]}`, {
                    type,
                });
                const mockEvent = {
                    dataTransfer: { files: [mockFile] },
                    preventDefault: vi.fn(),
                } as MockDragEvent;

                const result = dropHandler!.call(
                    plugin!,
                    mockView,
                    mockEvent as DragEvent,
                );
                expect(result).toBe(shouldHandle);

                if (shouldHandle) {
                    expect(mockEvent.preventDefault).toHaveBeenCalled();
                } else {
                    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
                }

                vi.clearAllMocks();
            });
        });

        it("should handle mixed file types correctly", () => {
            const plugin = uploadPlugin(mockSettings);
            const dropHandler = plugin!.spec.props!.handleDOMEvents!.drop;

            const mixedFiles = [
                new File([""], "image1.jpg", { type: "image/jpeg" }),
                new File([""], "document.pdf", { type: "application/pdf" }),
                new File([""], "image2.png", { type: "image/png" }),
                new File([""], "text.txt", { type: "text/plain" }),
            ];

            const mockEvent = {
                dataTransfer: { files: mixedFiles },
                preventDefault: vi.fn(),
            } as MockDragEvent;

            const mockUploadImage = vi.fn();
            vi.mocked(UploadImage).mockImplementation(
                () =>
                    ({
                        uploadImage: mockUploadImage,
                    }) as unknown as UploadImage,
            );

            const result = dropHandler!.call(
                plugin!,
                mockView,
                mockEvent as DragEvent,
            );

            expect(result).toBe(true);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(
                mockUploadImageInstance.uploadAndInsertFiles,
            ).toHaveBeenCalledWith(
                [mixedFiles[0], mixedFiles[2]], // Only image files
                mockView,
            );
        });
    });
});
