import { UploadImage } from "@/plugins/image-upload-plugin/upload";
import { ImageDOMAttrs } from "@/schema/nodes/image";
import { insertImage } from "@/utils/nodes";
import { EditorView } from "prosemirror-view";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

// Mock dependencies
vi.mock("@/utils/nodes", () => ({
    insertImage: vi.fn(),
}));

vi.mock("crelt", () => ({
    default: vi.fn((tag, props) => {
        const element = document.createElement(tag);
        Object.assign(element, props);
        return element;
    }),
}));

// Mock XMLHttpRequest
const mockXHR = {
    open: vi.fn(),
    send: vi.fn(),
    setRequestHeader: vi.fn(),
    addEventListener: vi.fn(),
    responseType: "",
    withCredentials: false,
    response: null as XMLHttpRequest["response"],
};

Object.defineProperty(window, "XMLHttpRequest", {
    writable: true,
    value: vi.fn(() => mockXHR),
});

describe("image-upload-plugin/upload", () => {
    let uploader: UploadImage;
    let mockView: EditorView;

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset XHR mock
        mockXHR.open.mockClear();
        mockXHR.send.mockClear();
        mockXHR.setRequestHeader.mockClear();
        mockXHR.addEventListener.mockClear();
        mockXHR.response = null;

        mockView = {
            state: {
                schema: {
                    nodes: { image: { create: vi.fn() } },
                },
                tr: {
                    replaceSelectionWith: vi.fn().mockReturnThis(),
                    scrollIntoView: vi.fn().mockReturnThis(),
                },
            },
            dispatch: vi.fn(),
        } as unknown as EditorView;
    });

    describe("constructor", () => {
        it("should create instance with endpoint", () => {
            uploader = new UploadImage("http://example.com/upload");
            expect(uploader).toBeInstanceOf(UploadImage);
        });

        it("should create instance without endpoint", () => {
            uploader = new UploadImage(undefined);
            expect(uploader).toBeInstanceOf(UploadImage);
        });
    });

    describe("uploadImage", () => {
        beforeEach(() => {
            uploader = new UploadImage("http://example.com/upload");
        });

        it("should handle single file upload", async () => {
            const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });

            // Mock successful response
            setTimeout(() => {
                const loadHandler = mockXHR.addEventListener.mock.calls.find(
                    (call) => call[0] === "load",
                )?.[1];
                mockXHR.response = {
                    url: "http://example.com/uploaded.jpg",
                    title: "Test",
                    description: "Alt text",
                    id: "image-123",
                    caption: "Test caption",
                };
                loadHandler?.();
            }, 0);

            const result = await uploader.uploadAndInsertFiles(
                [mockFile],
                mockView,
            );

            expect(result).toEqual({
                src: "http://example.com/uploaded.jpg",
                title: "Test",
                alt: "Alt text",
                imageId: "image-123",
                caption: "Test caption",
            });
            expect(insertImage).toHaveBeenCalledWith(
                {
                    src: "http://example.com/uploaded.jpg",
                    title: "Test",
                    alt: "Alt text",
                    imageId: "image-123",
                    caption: "Test caption",
                },
                mockView,
            );
        });

        it("should handle multiple file upload", async () => {
            const mockFiles = [
                new File([""], "test1.jpg", { type: "image/jpeg" }),
                new File([""], "test2.png", { type: "image/png" }),
            ];

            // Mock successful responses for both files
            let callCount = 0;
            mockXHR.addEventListener.mockImplementation((event, handler) => {
                if (event === "load") {
                    setTimeout(() => {
                        callCount++;
                        mockXHR.response = {
                            url: `http://example.com/uploaded${callCount}.jpg`,
                        };
                        handler();
                    }, 0);
                }
            });

            const result = await uploader.uploadAndInsertFiles(
                mockFiles,
                mockView,
            );

            expect(result).toBe(true);
        });

        it("should handle upload errors", async () => {
            const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            // Mock error response
            setTimeout(() => {
                const errorHandler = mockXHR.addEventListener.mock.calls.find(
                    (call) => call[0] === "error",
                )?.[1];
                errorHandler?.();
            }, 0);

            const result = await uploader.uploadAndInsertFiles(
                [mockFile],
                mockView,
            );

            expect(result).toEqual({ src: "", title: "", alt: "" });
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Failed to upload file:"),
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });
    });

    describe("handleImageUpload", () => {
        beforeEach(() => {
            uploader = new UploadImage("http://example.com/upload");

            // Mock DOM methods
            document.body.appendChild = vi.fn();
            document.body.removeChild = vi.fn();
        });

        it("should create file input and trigger click", () => {
            const result = uploader.uploadImage(mockView);

            expect(result).toBe(true);
            expect(document.body.appendChild).toHaveBeenCalled();

            // Verify file input properties
            const input = (document.body.appendChild as Mock).mock.calls[0][0];
            expect(input.type).toBe("file");
            expect(input.accept).toBe("image/*");
            expect(input.hidden).toBe(true);
        });

        it("should handle file selection", () => {
            const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });

            uploader.uploadImage(mockView);

            const input = (document.body.appendChild as Mock).mock.calls[0][0];
            const uploadImageSpy = vi.spyOn(uploader, "uploadAndInsertFiles");

            // Simulate file selection
            Object.defineProperty(input, "files", {
                value: [mockFile],
                writable: false,
            });

            input.onchange({ target: input });

            expect(uploadImageSpy).toHaveBeenCalledWith([mockFile], mockView);
            expect(document.body.removeChild).toHaveBeenCalledWith(input);
        });

        it("should handle cancel", () => {
            uploader.uploadImage(mockView);

            const input = (document.body.appendChild as Mock).mock.calls[0][0];

            input.oncancel();

            expect(document.body.removeChild).toHaveBeenCalledWith(input);
        });
    });

    describe("upload method", () => {
        beforeEach(() => {
            uploader = new UploadImage("http://example.com/upload");
        });

        it("should reject when no endpoint", async () => {
            const uploaderWithoutEndpoint = new UploadImage(undefined);
            const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });

            const result = await uploaderWithoutEndpoint.uploadAndInsertFiles(
                [mockFile],
                mockView,
            );

            expect(result).toEqual({
                src: "",
                title: "",
                alt: "",
            });
        });

        it("should set up XHR correctly", async () => {
            const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });

            // Start upload (don't await to check XHR setup)
            uploader.uploadAndInsertFiles([mockFile], mockView);

            expect(mockXHR.open).toHaveBeenCalledWith(
                "POST",
                "http://example.com/upload",
                true,
            );
            expect(mockXHR.responseType).toBe("json");
            expect(mockXHR.withCredentials).toBe(true);
            expect(mockXHR.addEventListener).toHaveBeenCalledWith(
                "load",
                expect.any(Function),
            );
            expect(mockXHR.addEventListener).toHaveBeenCalledWith(
                "error",
                expect.any(Function),
            );
            expect(mockXHR.addEventListener).toHaveBeenCalledWith(
                "abort",
                expect.any(Function),
            );
        });

        it("should include CSRF token if available", async () => {
            // Mock querySelector to return a CSRF token element
            const originalQuerySelector = document.querySelector;
            document.querySelector = vi.fn((selector) => {
                if (selector === "[name=csrfmiddlewaretoken]") {
                    return { value: "test-csrf-token" } as HTMLInputElement;
                }
                return originalQuerySelector.call(document, selector);
            });

            const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });

            uploader.uploadAndInsertFiles([mockFile], mockView);

            expect(mockXHR.setRequestHeader).toHaveBeenCalledWith(
                "X-CSRFToken",
                "test-csrf-token",
            );

            // Restore original querySelector
            document.querySelector = originalQuerySelector;
        });

        it("should handle response with error", async () => {
            const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            setTimeout(() => {
                const loadHandler = mockXHR.addEventListener.mock.calls.find(
                    (call) => call[0] === "load",
                )?.[1];
                mockXHR.response = { error: { message: "Upload failed" } };
                loadHandler?.();
            }, 0);

            const result = await uploader.uploadAndInsertFiles(
                [mockFile],
                mockView,
            );

            expect(result).toEqual({ src: "", title: "", alt: "" });
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("should handle abort event", async () => {
            const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            setTimeout(() => {
                const abortHandler = mockXHR.addEventListener.mock.calls.find(
                    (call) => call[0] === "abort",
                )?.[1];
                abortHandler?.();
            }, 0);

            const result = await uploader.uploadAndInsertFiles(
                [mockFile],
                mockView,
            );

            expect(result).toEqual({ src: "", title: "", alt: "" });
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe("multiple file handling", () => {
        beforeEach(() => {
            uploader = new UploadImage("http://example.com/upload");
        });

        it("should handle partial success in multiple uploads", async () => {
            const mockFiles = [
                new File([""], "test1.jpg", { type: "image/jpeg" }),
                new File([""], "test2.jpg", { type: "image/jpeg" }),
            ];

            const consoleSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            let callCount = 0;
            mockXHR.addEventListener.mockImplementation((event, handler) => {
                if (event === "load") {
                    setTimeout(() => {
                        callCount++;
                        if (callCount === 1) {
                            // First upload succeeds
                            mockXHR.response = {
                                url: "http://example.com/uploaded1.jpg",
                            };
                        } else {
                            // Second upload fails
                            mockXHR.response = { error: { message: "Failed" } };
                        }
                        handler();
                    }, 0);
                }
            });

            const result = await uploader.uploadAndInsertFiles(
                mockFiles,
                mockView,
            );

            expect(result).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining(
                    "Only 1 of 2 files uploaded successfully",
                ),
            );

            consoleSpy.mockRestore();
        });

        it("should handle complete failure in multiple uploads", async () => {
            const mockFiles = [
                new File([""], "test1.jpg", { type: "image/jpeg" }),
                new File([""], "test2.jpg", { type: "image/jpeg" }),
            ];

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            mockXHR.addEventListener.mockImplementation((event, handler) => {
                if (event === "error") {
                    setTimeout(() => {
                        handler();
                    }, 0);
                }
            });

            const result = await uploader.uploadAndInsertFiles(
                mockFiles,
                mockView,
            );

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Multiple file upload failed:"),
                "All uploads failed",
            );

            consoleSpy.mockRestore();
        });
    });

    describe("getImageAttributes method", () => {
        beforeEach(() => {
            uploader = new UploadImage("http://example.com/upload/");
        });

        it("should successfully fetch image attributes", async () => {
            const mockImageData = {
                id: "image-123",
                title: "Test Image",
                description: "Test description",
                caption: "Test caption",
                url: "http://example.com/image.jpg",
            };

            // Mock successful response
            setTimeout(() => {
                const loadHandler = mockXHR.addEventListener.mock.calls.find(
                    (call) => call[0] === "load",
                )?.[1];
                mockXHR.response = mockImageData;
                loadHandler?.();
            }, 0);

            const result = await uploader.getImageAttributes("image-123");

            expect(mockXHR.open).toHaveBeenCalledWith(
                "GET",
                "http://example.com/upload/image-123/",
                true,
            );
            expect(result).toEqual(mockImageData);
        });

        it("should handle fetch errors and return fallback data", async () => {
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            // Mock error response
            setTimeout(() => {
                const errorHandler = mockXHR.addEventListener.mock.calls.find(
                    (call) => call[0] === "error",
                )?.[1];
                errorHandler?.();
            }, 0);

            const result = await uploader.getImageAttributes("image-123");

            expect(result).toEqual({ id: "image-123" });
            expect(consoleSpy).toHaveBeenCalledWith(
                "Failed to fetch image data for image: image-123",
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });

        it("should handle fetch errors without imageId", async () => {
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            // Mock error response
            setTimeout(() => {
                const errorHandler = mockXHR.addEventListener.mock.calls.find(
                    (call) => call[0] === "error",
                )?.[1];
                errorHandler?.();
            }, 0);

            await uploader.getImageAttributes("");

            expect(consoleSpy).toHaveBeenCalledWith(
                "Failed to fetch image data",
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });
    });

    describe("updateImageAttributes method", () => {
        beforeEach(() => {
            uploader = new UploadImage("http://example.com/upload/");
        });

        it("should successfully update image attributes", async () => {
            const mockAttrs: ImageDOMAttrs = {
                src: "http://example.com/updated-image.jpg",
                id: "image-123",
                title: "Updated Title",
                alt: "Updated Alt",
                caption: "Updated Caption",
            };

            const mockResponse = {
                id: "image-123",
                name: "Updated Title",
                description: "Updated Alt",
                caption: "Updated Caption",
                url: "http://example.com/updated-image.jpg",
            };

            // Mock successful response
            setTimeout(() => {
                const loadHandler = mockXHR.addEventListener.mock.calls.find(
                    (call) => call[0] === "load",
                )?.[1];
                mockXHR.response = mockResponse;
                loadHandler?.();
            }, 0);

            await uploader.updateImageAttributes(mockAttrs, mockView);

            expect(mockXHR.open).toHaveBeenCalledWith(
                "PATCH",
                "http://example.com/upload/image-123/",
                true,
            );
            expect(mockXHR.setRequestHeader).toHaveBeenCalledWith(
                "Content-Type",
                "application/x-www-form-urlencoded",
            );

            // Verify the URL-encoded body was sent
            const sentBody = mockXHR.send.mock.calls[0][0];
            expect(sentBody).toContain("name=Updated+Title");
            expect(sentBody).toContain("description=Updated+Alt");
            expect(sentBody).toContain("default_caption=Updated+Caption");

            // Verify insertImage was called with correct attributes
            expect(insertImage).toHaveBeenCalledWith(
                {
                    title: "Updated Title",
                    alt: "Updated Alt",
                    imageId: "image-123",
                    caption: "Updated Caption",
                    src: "http://example.com/updated-image.jpg",
                },
                mockView,
            );
        });

        it("should handle missing attributes gracefully", async () => {
            const mockAttrs = {
                id: "image-123",
                // Missing title, alt, caption
            } as ImageDOMAttrs;

            const mockResponse = {
                id: "image-123",
                url: "http://example.com/image.jpg",
            };

            setTimeout(() => {
                const loadHandler = mockXHR.addEventListener.mock.calls.find(
                    (call) => call[0] === "load",
                )?.[1];
                mockXHR.response = mockResponse;
                loadHandler?.();
            }, 0);

            await uploader.updateImageAttributes(mockAttrs, mockView);

            // Should not add params for missing attributes
            const sentBody = mockXHR.send.mock.calls[0][0];
            expect(sentBody).toBe(""); // No parameters should be added
        });

        it("should handle update errors", async () => {
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const mockAttrs = {
                id: "image-123",
                title: "Test Title",
            } as ImageDOMAttrs;

            // Mock error response
            setTimeout(() => {
                const errorHandler = mockXHR.addEventListener.mock.calls.find(
                    (call) => call[0] === "error",
                )?.[1];
                errorHandler?.();
            }, 0);

            await uploader.updateImageAttributes(mockAttrs, mockView);

            expect(consoleSpy).toHaveBeenCalledWith(
                "Image update failed",
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });

        it("should handle patch errors with imageId", async () => {
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const mockAttrs = {
                id: "image-456",
                title: "Test Title",
            } as ImageDOMAttrs;

            // Mock error response
            setTimeout(() => {
                const errorHandler = mockXHR.addEventListener.mock.calls.find(
                    (call) => call[0] === "error",
                )?.[1];
                errorHandler?.();
            }, 0);

            await uploader.updateImageAttributes(mockAttrs, mockView);

            expect(consoleSpy).toHaveBeenCalledWith(
                "Image update failed",
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });

        it("should not insert image if no src in response", async () => {
            const mockAttrs = {
                id: "image-123",
                title: "Test Title",
            } as ImageDOMAttrs;

            const mockResponse = {
                id: "image-123",
                name: "Test Title",
                // Missing url/src
            };

            setTimeout(() => {
                const loadHandler = mockXHR.addEventListener.mock.calls.find(
                    (call) => call[0] === "load",
                )?.[1];
                mockXHR.response = mockResponse;
                loadHandler?.();
            }, 0);

            await uploader.updateImageAttributes(mockAttrs, mockView);

            // insertImage should not be called without src
            expect(insertImage).not.toHaveBeenCalled();
        });
    });

    describe("private methods error handling", () => {
        beforeEach(() => {
            uploader = new UploadImage("http://example.com/upload/");
        });

        it("should handle patch method with different data types", async () => {
            const mockAttrs = {
                id: "image-123",
                title: "Test Title",
                alt: "Test Alt",
                caption: "Test Caption",
            } as ImageDOMAttrs;

            setTimeout(() => {
                const loadHandler = mockXHR.addEventListener.mock.calls.find(
                    (call) => call[0] === "load",
                )?.[1];
                mockXHR.response = { id: "image-123" };
                loadHandler?.();
            }, 0);

            await uploader.updateImageAttributes(mockAttrs, mockView);

            // Check that Content-Type header was set for URL-encoded body
            expect(mockXHR.setRequestHeader).toHaveBeenCalledWith(
                "Content-Type",
                "application/x-www-form-urlencoded",
            );
        });

        it("should handle get method error paths", async () => {
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            setTimeout(() => {
                const errorHandler = mockXHR.addEventListener.mock.calls.find(
                    (call) => call[0] === "error",
                )?.[1];
                errorHandler?.();
            }, 0);

            const result = await uploader.getImageAttributes("image-123");

            expect(mockXHR.open).toHaveBeenCalledWith(
                "GET",
                "http://example.com/upload/image-123/",
                true,
            );
            expect(result).toEqual({ id: "image-123" });
            expect(consoleSpy).toHaveBeenCalledWith(
                "Failed to fetch image data for image: image-123",
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });
    });
});
