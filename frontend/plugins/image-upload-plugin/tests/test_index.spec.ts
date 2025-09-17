import { imageUploadPlugin } from "@/plugins/image-upload-plugin";
import { uploadPlugin } from "@/plugins/image-upload-plugin/plugin";
import { imageKeymapPlugin } from "@/plugins/image-upload-plugin/keymap";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDPMSettings } from "@/types/types";
import { NodeType } from "@/schema/types";

// Mock the sub-modules
vi.mock("@/plugins/image-upload-plugin/plugin", () => ({
    uploadPlugin: vi.fn(() => ({ type: "upload" })),
}));

vi.mock("@/plugins/image-upload-plugin/keymap", () => ({
    imageKeymapPlugin: vi.fn(() => ({ type: "keymap" })),
}));

describe("image-upload-plugin/index", () => {
    let mockSettings: IDPMSettings;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSettings = {
            uploadEndpoint: "http://example.com/upload",
            allowedNodes: [NodeType.FILER_IMAGE],
            allowedMarks: [],
        };
    });

    describe("imageUploadPlugin", () => {
        let plugins = imageUploadPlugin(mockSettings, true);

        it("should return array of plugins", () => {
            plugins = imageUploadPlugin(mockSettings, true);

            expect(Array.isArray(plugins)).toBe(true);
            expect(plugins).toHaveLength(2);

            expect(plugins[0]).toEqual({ type: "upload" });
            expect(plugins[1]).toEqual({ type: "keymap" });

            expect(uploadPlugin).toHaveBeenCalledWith(mockSettings);
            expect(imageKeymapPlugin).toHaveBeenCalledWith(mockSettings);
        });

        it("should return empty array if no upload endpoint", () => {
            mockSettings = {
                ...mockSettings,
                uploadEndpoint: undefined,
            };

            plugins = imageUploadPlugin(mockSettings, true);

            expect(Array.isArray(plugins)).toBe(true);
            expect(plugins.length).toBe(0);

            expect(uploadPlugin).not.toHaveBeenCalledWith(mockSettings);
            expect(imageKeymapPlugin).not.toHaveBeenCalledWith(mockSettings);
        });

        it("should return empty array if no image node", () => {
            plugins = imageUploadPlugin(mockSettings, false);

            expect(Array.isArray(plugins)).toBe(true);
            expect(plugins.length).toBe(0);

            expect(uploadPlugin).not.toHaveBeenCalledWith(mockSettings);
            expect(imageKeymapPlugin).not.toHaveBeenCalledWith(mockSettings);
        });
    });
});
