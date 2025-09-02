import { imageKeymapPlugin } from "@/plugins/image-upload-plugin/keymap";
import { UploadImage } from "@/plugins/image-upload-plugin/upload";
import { IDPMSettings } from "@/types/types";
import { isImageSelected } from "@/utils";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/utils", () => ({
    isImageSelected: vi.fn(),
}));

vi.mock("@/plugins/image-upload-plugin/upload", () => ({
    UploadImage: vi.fn().mockImplementation(() => ({
        handleImageUpload: vi.fn(),
        uploadImage: vi.fn(),
    })),
}));

vi.mock("prosemirror-keymap", () => ({
    keymap: vi.fn((keymap) => ({ type: "keymap", keymap })),
}));

describe("image-upload-plugin/keymap", () => {
    let mockSettings: IDPMSettings;
    let mockView: EditorView;
    let mockState: EditorState;
    let mockDispatch: EditorView["dispatch"];

    beforeEach(() => {
        vi.clearAllMocks();

        mockSettings = {
            uploadEndpoint: "http://example.com/upload",
        } as unknown as IDPMSettings;

        mockDispatch = vi.fn();
        mockState = {
            tr: {
                deleteSelection: vi.fn().mockReturnThis(),
            },
        } as unknown as EditorState;

        mockView = {
            state: mockState,
            dispatch: vi.fn(),
        } as unknown as EditorView;
    });

    describe("imageKeymapPlugin", () => {
        it("should create keymap with image commands when image node exists", () => {
            const plugin = imageKeymapPlugin(mockSettings);

            // @ts-expect-error keymap is available
            expect(plugin.keymap).toHaveProperty("Mod-i");
            // @ts-expect-error keymap is available
            expect(typeof plugin.keymap["Mod-i"]).toBe("function");
        });

        it("should initialize UploadImage with endpoint", () => {
            imageKeymapPlugin(mockSettings);

            expect(UploadImage).toHaveBeenCalledWith(
                mockSettings.uploadEndpoint,
            );
        });
    });

    describe("keymap commands", () => {
        describe("Mod-i command", () => {
            it("should return false when no view provided", () => {
                const plugin = imageKeymapPlugin(mockSettings);
                // @ts-expect-error keymap is available
                const command = plugin.keymap["Mod-i"];

                const result = command(mockState, mockDispatch, undefined);

                expect(result).toBe(false);
                expect(isImageSelected).not.toHaveBeenCalled();
            });

            it("should return false when no image selected", () => {
                vi.mocked(isImageSelected).mockReturnValue(false);

                const plugin = imageKeymapPlugin(mockSettings);
                // @ts-expect-error keymap is available
                const command = plugin.keymap["Mod-i"];

                const result = command(mockState, mockDispatch, mockView);

                expect(result).toBe(false);
                expect(isImageSelected).toHaveBeenCalledWith(mockView);
            });

            it("should handle image upload when image selected", () => {
                vi.mocked(isImageSelected).mockReturnValue(true);
                const mockUploadImage = vi.fn().mockReturnValue(true);
                vi.mocked(UploadImage).mockImplementation(
                    () =>
                        ({
                            handleImageUpload: vi.fn(),
                            uploadImage: mockUploadImage,
                        }) as unknown as UploadImage,
                );

                const plugin = imageKeymapPlugin(mockSettings);
                // @ts-expect-error keymap is available
                const command = plugin.keymap["Mod-i"];

                const result = command(mockState, mockDispatch, mockView);

                expect(result).toBe(true);
                expect(isImageSelected).toHaveBeenCalledWith(mockView);
                expect(mockUploadImage).toHaveBeenCalledWith(mockView);
            });

            it("should return false when uploadImage fails", () => {
                vi.mocked(isImageSelected).mockReturnValue(true);
                const mockUploadImage = vi.fn().mockReturnValue(false);
                vi.mocked(UploadImage).mockImplementation(
                    () =>
                        ({
                            handleImageUpload: vi.fn(),
                            uploadImage: mockUploadImage,
                        }) as unknown as UploadImage,
                );

                const plugin = imageKeymapPlugin(mockSettings);
                // @ts-expect-error keymap is available
                const command = plugin.keymap["Mod-i"];

                const result = command(mockState, mockDispatch, mockView);

                expect(result).toBe(false);
                expect(mockUploadImage).toHaveBeenCalledWith(mockView);
            });
        });
    });

    describe("integration scenarios", () => {
        it("should work with different upload endpoints", () => {
            const settings1 = {
                uploadEndpoint: "http://example1.com/upload",
            } as unknown as IDPMSettings;
            const settings2 = {
                uploadEndpoint: "http://example2.com/upload",
            } as unknown as IDPMSettings;

            imageKeymapPlugin(settings1);
            imageKeymapPlugin(settings2);

            expect(UploadImage).toHaveBeenCalledWith(settings1.uploadEndpoint);
            expect(UploadImage).toHaveBeenCalledWith(settings2.uploadEndpoint);
        });

        it("should handle all commands consistently", () => {
            vi.mocked(isImageSelected).mockReturnValue(true);
            const mockUploadImage = vi.fn().mockReturnValue(true);
            vi.mocked(UploadImage).mockImplementation(
                () =>
                    ({
                        handleImageUpload: vi.fn(),
                        uploadImage: mockUploadImage,
                    }) as unknown as UploadImage,
            );

            const plugin = imageKeymapPlugin(mockSettings);

            // @ts-expect-error keymap is available
            const modIResult = plugin.keymap["Mod-i"](
                mockState,
                mockDispatch,
                mockView,
            );
            expect(modIResult).toBe(true);

            expect(isImageSelected).toHaveBeenCalledTimes(1);
        });
    });
});
