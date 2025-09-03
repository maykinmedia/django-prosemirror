import { translate } from "@/i18n/translations";
import { imageToolbarMenuConfig } from "@/plugins/image-toolbar-plugin/config";
import { ImageDOMAttrs } from "@/schema/nodes/image";
import { Node } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/i18n/translations", () => ({
    translate: vi.fn((key: string) => `translated_${key}`),
}));

vi.mock("@/utils/nodes", () => ({
    insertImage: vi.fn(),
}));

describe("image-toolbar-plugin/config", () => {
    let mockView: EditorView;
    let mockTarget: Node;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock target node (image)
        mockTarget = {
            type: { name: "image" },
            attrs: {
                src: "http://example.com/image.jpg",
                title: "Test Image",
                alt: "Alternative text",
            },
        } as unknown as Node;

        // Mock view
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
                ["image-upload-plugin$"]: {
                    uploader: {
                        uploadImage: vi.fn().mockReturnValue(true),
                        getImageAttributes: vi.fn().mockResolvedValue({}),
                        updateImageAttributes: vi.fn().mockResolvedValue({}),
                    },
                },
            },
            dispatch: vi.fn(),
        } as unknown as EditorView;
    });

    describe("imageToolbarMenuConfig", () => {
        it("should return array of menu items", () => {
            const menuItems = imageToolbarMenuConfig(mockView, mockTarget);

            expect(Array.isArray(menuItems)).toBe(true);
            expect(menuItems).toHaveLength(2);
        });

        it("should include edit image menu item", () => {
            const menuItems = imageToolbarMenuConfig(mockView, mockTarget);
            const editItem = menuItems[0];

            expect(editItem.icon).toBe("replaceImage");
            expect(editItem.title).toBe("translated_Replace image file");
            expect(editItem.enabled).toBeDefined();
            expect(editItem.command).toBeDefined();
        });

        it("should include replace image menu item", () => {
            const menuItems = imageToolbarMenuConfig(mockView, mockTarget);
            const replaceItem = menuItems[1];

            expect(replaceItem.icon).toBe("changeAlt");
            expect(replaceItem.title).toBe("translated_Change image settings");
            expect(replaceItem.enabled).toBeDefined();
            expect(replaceItem.modalFormProps).toBeDefined();
        });

        describe("edit image item", () => {
            it("should be enabled when target has src", () => {
                const menuItems = imageToolbarMenuConfig(mockView, mockTarget);
                const editItem = menuItems[0];

                const enabled = editItem.enabled!(mockView.state);
                expect(enabled).toBe(true);
            });

            it("should be disabled when target has no src", () => {
                const targetWithoutSrc = {
                    ...mockTarget,
                    attrs: { ...mockTarget.attrs, src: "" },
                } as unknown as Node;

                const menuItems = imageToolbarMenuConfig(
                    mockView,
                    targetWithoutSrc,
                );
                const editItem = menuItems[0];

                const enabled = editItem.enabled!(mockView.state);
                expect(enabled).toBe(false);
            });

            it("should be disabled when target src is null", () => {
                const targetWithNullSrc = {
                    ...mockTarget,
                    attrs: { ...mockTarget.attrs, src: null },
                } as unknown as Node;

                const menuItems = imageToolbarMenuConfig(
                    mockView,
                    targetWithNullSrc,
                );
                const editItem = menuItems[0];

                const enabled = editItem.enabled!(mockView.state);
                expect(enabled).toBe(false);
            });

            it("should be disabled and warn when uploader not available", () => {
                const consoleWarnSpy = vi
                    .spyOn(console, "warn")
                    .mockImplementation(() => {});

                const mockStateWithoutUploader = {
                    ...mockView.state,
                    ["image-upload-plugin$"]: undefined,
                };

                const menuItems = imageToolbarMenuConfig(mockView, mockTarget);
                const editItem = menuItems[0];

                const enabled = editItem.enabled!(
                    mockStateWithoutUploader as EditorState,
                );

                expect(enabled).toBe(false);
                expect(consoleWarnSpy).toHaveBeenCalledWith(
                    "Replace image command requires imageUpload plugin to be active",
                );

                consoleWarnSpy.mockRestore();
            });

            describe("edit command", () => {
                beforeEach(() => {
                    // Mock window.open and related functions
                    Object.defineProperty(window, "open", {
                        value: vi.fn(),
                        writable: true,
                    });
                    Object.defineProperty(window, "addEventListener", {
                        value: vi.fn(),
                        writable: true,
                    });
                    Object.defineProperty(window, "removeEventListener", {
                        value: vi.fn(),
                        writable: true,
                    });
                });

                it("should return false when no view provided", () => {
                    const menuItems = imageToolbarMenuConfig(
                        mockView,
                        mockTarget,
                    );
                    const editItem = menuItems[0];

                    const result = editItem.command!(
                        mockView.state,
                        vi.fn(),
                        undefined,
                    );
                    expect(result).toBe(false);
                });

                it("should call uploader uploadImage method", () => {
                    const menuItems = imageToolbarMenuConfig(
                        mockView,
                        mockTarget,
                    );
                    const editItem = menuItems[0];

                    const result = editItem.command!(
                        mockView.state,
                        vi.fn(),
                        mockView,
                    );

                    const uploader =
                        mockView.state["image-upload-plugin$"]!.uploader;
                    expect(uploader.uploadImage).toHaveBeenCalledWith(mockView);
                    expect(result).toBe(true);
                });

                it("should return false when uploader not available", () => {
                    const viewWithoutUploader = {
                        ...mockView,
                        state: {
                            ...mockView.state,
                            ["image-upload-plugin$"]: undefined,
                        },
                    } as unknown as EditorView;

                    const menuItems = imageToolbarMenuConfig(
                        viewWithoutUploader,
                        mockTarget,
                    );
                    const editItem = menuItems[0];

                    const result = editItem.command!(
                        viewWithoutUploader.state,
                        vi.fn(),
                        viewWithoutUploader,
                    );

                    expect(result).toBe(false);
                });

                it("should handle uploader method returning false", () => {
                    const mockUploaderWithFalse = {
                        ...mockView.state["image-upload-plugin$"]!.uploader,
                        uploadImage: vi.fn().mockReturnValue(false),
                    };

                    const viewWithFalseUploader = {
                        ...mockView,
                        state: {
                            ...mockView.state,
                            ["image-upload-plugin$"]: {
                                uploader: mockUploaderWithFalse,
                            },
                        },
                    } as unknown as EditorView;

                    const menuItems = imageToolbarMenuConfig(
                        viewWithFalseUploader,
                        mockTarget,
                    );
                    const editItem = menuItems[0];

                    const result = editItem.command!(
                        viewWithFalseUploader.state,
                        vi.fn(),
                        viewWithFalseUploader,
                    );

                    expect(
                        mockUploaderWithFalse.uploadImage,
                    ).toHaveBeenCalledWith(viewWithFalseUploader);
                    expect(result).toBe(false);
                });

                it("should call uploader when view is provided", () => {
                    const menuItems = imageToolbarMenuConfig(
                        mockView,
                        mockTarget,
                    );
                    const editItem = menuItems[0];

                    const result = editItem.command!(
                        mockView.state,
                        vi.fn(),
                        mockView,
                    );

                    const uploader =
                        mockView.state["image-upload-plugin$"]!.uploader;
                    expect(uploader.uploadImage).toHaveBeenCalledWith(mockView);
                    expect(result).toBe(true);
                });

                it("should handle uploader when available", () => {
                    const menuItems = imageToolbarMenuConfig(
                        mockView,
                        mockTarget,
                    );
                    const editItem = menuItems[0];

                    const result = editItem.command!(
                        mockView.state,
                        vi.fn(),
                        mockView,
                    );

                    const uploader =
                        mockView.state["image-upload-plugin$"]!.uploader;
                    expect(uploader.uploadImage).toHaveBeenCalledWith(mockView);
                    expect(result).toBe(true);
                });

                it("should work with different target attributes", () => {
                    const targetWithEmptyAttrs = {
                        ...mockTarget,
                        attrs: {
                            src: "http://example.com/image.jpg",
                            title: "  ", // whitespace only
                            alt: "", // empty
                        },
                    } as unknown as Node;

                    const menuItems = imageToolbarMenuConfig(
                        mockView,
                        targetWithEmptyAttrs,
                    );
                    const editItem = menuItems[0];

                    const result = editItem.command!(
                        mockView.state,
                        vi.fn(),
                        mockView,
                    );

                    const uploader =
                        mockView.state["image-upload-plugin$"]!.uploader;
                    expect(uploader.uploadImage).toHaveBeenCalledWith(mockView);
                    expect(result).toBe(true);
                });
            });
        });

        describe("replace image item", () => {
            it("should check for uploader in enabled function", () => {
                const mockState = {
                    ["image-upload-plugin$"]: {
                        uploader: { handleImageUpload: vi.fn() },
                    },
                };

                const menuItems = imageToolbarMenuConfig(mockView, mockTarget);
                const replaceItem = menuItems[1];

                const enabled = replaceItem.enabled!(
                    mockState as unknown as EditorState,
                );
                expect(enabled).toBe(true);
            });

            it("should be enabled when target has src attribute", () => {
                const menuItems = imageToolbarMenuConfig(mockView, mockTarget);
                const replaceItem = menuItems[1];

                const enabled = replaceItem.enabled!(mockView.state);
                expect(enabled).toBe(true);
            });

            describe("modal form", () => {
                it("should have modal form configuration", () => {
                    const menuItems = imageToolbarMenuConfig(
                        mockView,
                        mockTarget,
                    );
                    const replaceItem = menuItems[1];

                    expect(replaceItem.modalFormProps).toBeDefined();
                    expect(replaceItem.modalFormProps?.title).toBe(
                        "translated_Change image settings",
                    );
                    expect(replaceItem.modalFormProps?.fields).toBeDefined();
                    expect(
                        Array.isArray(replaceItem.modalFormProps?.fields),
                    ).toBe(true);
                });

                it("should have required form fields", () => {
                    const menuItems = imageToolbarMenuConfig(
                        mockView,
                        mockTarget,
                    );
                    const replaceItem = menuItems[1];
                    const fields = replaceItem.modalFormProps?.fields;

                    expect(fields).toBeDefined();
                    expect(fields?.length).toBe(4);
                    expect(fields?.[0].name).toBe("id");
                    expect(fields?.[1].name).toBe("title");
                    expect(fields?.[2].name).toBe("alt");
                    expect(fields?.[3].name).toBe("caption");
                });

                it("should have initial data function", () => {
                    const menuItems = imageToolbarMenuConfig(
                        mockView,
                        mockTarget,
                    );
                    const replaceItem = menuItems[1];

                    expect(
                        replaceItem.modalFormProps?.initialData,
                    ).toBeDefined();
                    expect(typeof replaceItem.modalFormProps?.initialData).toBe(
                        "function",
                    );
                });

                describe("initialData function", () => {
                    it("should return fallback data when no uploader available", async () => {
                        const mockStateWithoutUploader = {
                            ["image-upload-plugin$"]: undefined,
                        };

                        const menuItems = imageToolbarMenuConfig(
                            mockView,
                            mockTarget,
                        );
                        const replaceItem = menuItems[1];
                        const initialData =
                            replaceItem.modalFormProps?.initialData;

                        expect(initialData).toBeDefined();
                        const result = await initialData!(
                            mockStateWithoutUploader as EditorState,
                        );

                        expect(result).toEqual({
                            title: "Test Image",
                            alt: "Alternative text",
                            src: mockTarget.attrs.src,
                        });
                    });

                    it("should return fallback data when uploader available but no imageId", async () => {
                        const targetWithoutImageId = {
                            ...mockTarget,
                            attrs: {
                                ...mockTarget.attrs,
                                imageId: undefined,
                            },
                        } as unknown as Node;

                        const menuItems = imageToolbarMenuConfig(
                            mockView,
                            targetWithoutImageId,
                        );
                        const replaceItem = menuItems[1];
                        const initialData =
                            replaceItem.modalFormProps?.initialData;

                        const result = await initialData!(
                            mockView.state as EditorState,
                        );

                        expect(result).toEqual({
                            id: undefined,
                            title: "Test Image",
                            alt: "Alternative text",
                            caption: undefined,
                        });
                    });

                    it("should fetch and return image data when uploader available", async () => {
                        const mockImageData = {
                            id: "image-123",
                            title: "Fetched Title",
                            description: "Fetched Description",
                            caption: "Fetched Caption",
                        };

                        const mockTargetWithImageId = {
                            ...mockTarget,
                            attrs: {
                                ...mockTarget.attrs,
                                imageId: "image-123",
                            },
                        } as unknown as Node;

                        const mockUploader = {
                            ...mockView.state["image-upload-plugin$"]!.uploader,
                            getImageAttributes: vi
                                .fn()
                                .mockResolvedValue(mockImageData),
                        };

                        const mockStateWithUploader = {
                            ...mockView.state,
                            ["image-upload-plugin$"]: {
                                uploader: mockUploader,
                            },
                        };

                        const menuItems = imageToolbarMenuConfig(
                            mockView,
                            mockTargetWithImageId,
                        );
                        const replaceItem = menuItems[1];
                        const initialData =
                            replaceItem.modalFormProps?.initialData;

                        const result = await initialData!(
                            mockStateWithUploader as unknown as EditorState,
                        );

                        expect(
                            mockUploader.getImageAttributes,
                        ).toHaveBeenCalledWith("image-123");
                        expect(result).toEqual({
                            id: "image-123",
                            title: "Fetched Title",
                            alt: "Fetched Description",
                            caption: "Fetched Caption",
                        });
                    });

                    it("should return fallback data when uploader.getImageAttributes returns null", async () => {
                        const mockTargetWithImageId = {
                            ...mockTarget,
                            attrs: {
                                ...mockTarget.attrs,
                                imageId: "image-123",
                            },
                        } as unknown as Node;

                        const mockUploader = {
                            ...mockView.state["image-upload-plugin$"]!.uploader,
                            getImageAttributes: vi.fn().mockResolvedValue(null),
                        };

                        const mockStateWithUploader = {
                            ...mockView.state,
                            ["image-upload-plugin$"]: {
                                uploader: mockUploader,
                            },
                        };

                        const menuItems = imageToolbarMenuConfig(
                            mockView,
                            mockTargetWithImageId,
                        );
                        const replaceItem = menuItems[1];
                        const initialData =
                            replaceItem.modalFormProps?.initialData;

                        const result = await initialData!(
                            mockStateWithUploader as unknown as EditorState,
                        );

                        expect(result).toEqual({
                            imageId: "image-123",
                            title: "Test Image",
                            alt: "Alternative text",
                            src: mockTargetWithImageId.attrs.src,
                        });
                    });

                    it("should return fallback data when uploader.getImageAttributes throws error", async () => {
                        const mockTargetWithImageId = {
                            ...mockTarget,
                            attrs: {
                                ...mockTarget.attrs,
                                imageId: "image-123",
                            },
                        } as unknown as Node;

                        const mockUploader = {
                            ...mockView.state["image-upload-plugin$"]!.uploader,
                            getImageAttributes: vi
                                .fn()
                                .mockRejectedValue(new Error("Fetch failed")),
                        };

                        const mockStateWithUploader = {
                            ...mockView.state,
                            ["image-upload-plugin$"]: {
                                uploader: mockUploader,
                            },
                        };

                        const menuItems = imageToolbarMenuConfig(
                            mockView,
                            mockTargetWithImageId,
                        );
                        const replaceItem = menuItems[1];
                        const initialData =
                            replaceItem.modalFormProps?.initialData;

                        const result = await initialData!(
                            mockStateWithUploader as unknown as EditorState,
                        );

                        expect(result).toEqual({
                            imageId: "image-123",
                            title: "Test Image",
                            alt: "Alternative text",
                            src: mockTargetWithImageId.attrs.src,
                        });
                    });

                    it("should use fallback values for missing image data fields", async () => {
                        const partialImageData = {
                            id: "image-123",
                            title: "Fetched Title",
                            // Missing description and caption
                        };

                        const mockTargetWithImageId = {
                            ...mockTarget,
                            attrs: {
                                ...mockTarget.attrs,
                                imageId: "image-123",
                                caption: "Fallback Caption",
                            },
                        } as unknown as Node;

                        const mockUploader = {
                            ...mockView.state["image-upload-plugin$"]!.uploader,
                            getImageAttributes: vi
                                .fn()
                                .mockResolvedValue(partialImageData),
                        };

                        const mockStateWithUploader = {
                            ...mockView.state,
                            ["image-upload-plugin$"]: {
                                uploader: mockUploader,
                            },
                        };

                        const menuItems = imageToolbarMenuConfig(
                            mockView,
                            mockTargetWithImageId,
                        );
                        const replaceItem = menuItems[1];
                        const initialData =
                            replaceItem.modalFormProps?.initialData;

                        const result = await initialData!(
                            mockStateWithUploader as unknown as EditorState,
                        );

                        expect(result).toEqual({
                            id: "image-123",
                            title: "Fetched Title",
                            alt: "Alternative text", // fallback
                            caption: "Fallback Caption", // fallback
                        });
                    });

                    it("should handle target with null/undefined attributes in fallback data", async () => {
                        const mockTargetWithNullAttrs = {
                            ...mockTarget,
                            attrs: {
                                src: "http://example.com/image.jpg",
                                imageId: null,
                                title: null,
                                alt: null,
                                caption: null,
                            },
                        } as unknown as Node;

                        const menuItems = imageToolbarMenuConfig(
                            mockView,
                            mockTargetWithNullAttrs,
                        );
                        const replaceItem = menuItems[1];
                        const initialData =
                            replaceItem.modalFormProps?.initialData;

                        const mockStateWithoutUploader = {
                            ["image-upload-plugin$"]: undefined,
                        };

                        if (!initialData)
                            throw new Error("initialData is undefined");
                        const result = await initialData(
                            mockStateWithoutUploader as unknown as EditorState,
                        );

                        expect(result).toEqual({
                            src: mockTargetWithNullAttrs.attrs.src,
                            imageId: null, // fallback for null imageId
                            title: null, // fallback for null title
                            alt: null, // fallback for null alt
                            caption: null, // fallback for null caption
                        });
                    });
                });

                it("should have submit function", () => {
                    const menuItems = imageToolbarMenuConfig(
                        mockView,
                        mockTarget,
                    );
                    const replaceItem = menuItems[1];

                    expect(replaceItem.modalFormProps?.onSubmit).toBeDefined();
                    expect(typeof replaceItem.modalFormProps?.onSubmit).toBe(
                        "function",
                    );
                });

                describe("onSubmit function", () => {
                    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

                    beforeEach(() => {
                        consoleWarnSpy = vi
                            .spyOn(console, "warn")
                            .mockImplementation(() => {});
                    });

                    it("should log submit call and return early when no uploader available", async () => {
                        const mockStateWithoutUploader = {
                            ["image-upload-plugin$"]: undefined,
                        };

                        const formData = {
                            id: "image-123",
                            title: "New Title",
                            alt: "New Alt",
                            caption: "New Caption",
                        };

                        const menuItems = imageToolbarMenuConfig(
                            mockView,
                            mockTarget,
                        );
                        const replaceItem = menuItems[1];
                        const onSubmit = replaceItem.modalFormProps?.onSubmit;

                        await onSubmit!(
                            mockStateWithoutUploader as unknown as EditorState,
                            formData as ImageDOMAttrs,
                        );

                        expect(consoleWarnSpy).toHaveBeenCalledWith(
                            "Image update requires imageUpload plugin to be active",
                        );
                    });

                    it("should call uploader.updateImageAttributes with correct data when uploader available", async () => {
                        const mockUploader = {
                            ...mockView.state["image-upload-plugin$"]!.uploader,
                            updateImageAttributes: vi
                                .fn()
                                .mockResolvedValue({}),
                        };

                        const mockStateWithUploader = {
                            ...mockView.state,
                            ["image-upload-plugin$"]: {
                                uploader: mockUploader,
                            },
                        };

                        const formData = {
                            id: "image-123",
                            title: "New Title",
                            alt: "New Alt",
                            caption: "New Caption",
                        };

                        const menuItems = imageToolbarMenuConfig(
                            mockView,
                            mockTarget,
                        );
                        const replaceItem = menuItems[1];
                        const onSubmit = replaceItem.modalFormProps?.onSubmit;

                        await onSubmit!(
                            mockStateWithUploader as unknown as EditorState,
                            formData as ImageDOMAttrs,
                        );

                        expect(
                            mockUploader.updateImageAttributes,
                        ).toHaveBeenCalledWith(
                            {
                                ...mockTarget.attrs,
                                id: "image-123",
                                title: "New Title",
                                alt: "New Alt",
                                caption: "New Caption",
                            },
                            mockView,
                        );
                    });

                    it("should handle missing form data fields gracefully", async () => {
                        const mockUploader = {
                            ...mockView.state["image-upload-plugin$"]!.uploader,
                            updateImageAttributes: vi
                                .fn()
                                .mockResolvedValue({}),
                        };

                        const mockStateWithUploader = {
                            ...mockView.state,
                            ["image-upload-plugin$"]: {
                                uploader: mockUploader,
                            },
                        };

                        const mockTargetWithImageId = {
                            ...mockTarget,
                            attrs: {
                                ...mockTarget.attrs,
                                imageId: "existing-123",
                                caption: "Existing Caption",
                            },
                        } as unknown as Node;

                        const formData = {
                            // Missing id, should use target.attrs.imageId
                            title: "New Title",
                            alt: "New Alt",
                            // Missing caption, should use target.attrs.caption
                        };

                        const menuItems = imageToolbarMenuConfig(
                            mockView,
                            mockTargetWithImageId,
                        );
                        const replaceItem = menuItems[1];
                        const onSubmit = replaceItem.modalFormProps?.onSubmit;

                        await onSubmit!(
                            mockStateWithUploader as unknown as EditorState,
                            formData as ImageDOMAttrs,
                        );

                        expect(
                            mockUploader.updateImageAttributes,
                        ).toHaveBeenCalledWith(
                            {
                                src: mockTargetWithImageId.attrs.src,
                                id: "existing-123", // fallback to target.attrs.imageId
                                title: "New Title",
                                alt: "New Alt",
                                caption: "Existing Caption", // fallback to target.attrs.caption
                            },
                            mockView,
                        );
                    });

                    it("should handle empty string form data id by using target imageId", async () => {
                        const mockUploader = {
                            ...mockView.state["image-upload-plugin$"]!.uploader,
                            updateImageAttributes: vi
                                .fn()
                                .mockResolvedValue({}),
                        };

                        const mockStateWithUploader = {
                            ...mockView.state,
                            ["image-upload-plugin$"]: {
                                uploader: mockUploader,
                            },
                        };

                        const mockTargetWithImageId = {
                            ...mockTarget,
                            attrs: {
                                ...mockTarget.attrs,
                                imageId: "target-image-id",
                            },
                        } as unknown as Node;

                        const formData = {
                            id: "", // Empty string should fallback to target.attrs.imageId
                            title: "New Title",
                            alt: "New Alt",
                            caption: "New Caption",
                        };

                        const menuItems = imageToolbarMenuConfig(
                            mockView,
                            mockTargetWithImageId,
                        );
                        const replaceItem = menuItems[1];
                        const onSubmit = replaceItem.modalFormProps?.onSubmit;

                        onSubmit?.(
                            mockStateWithUploader as unknown as EditorState,
                            formData as ImageDOMAttrs,
                        );

                        expect(
                            mockUploader.updateImageAttributes,
                        ).toHaveBeenCalledWith(
                            {
                                src: mockTargetWithImageId.attrs.src,
                                id: "target-image-id", // Should use target.attrs.imageId
                                title: "New Title",
                                alt: "New Alt",
                                caption: "New Caption",
                            },
                            mockView,
                        );
                    });
                });
            });
        });

        describe("translation calls", () => {
            it("should translate menu item titles", () => {
                imageToolbarMenuConfig(mockView, mockTarget);

                expect(translate).toHaveBeenCalledWith("Replace image file");
                expect(translate).toHaveBeenCalledWith("Change image settings");
            });
        });

        describe("edge cases", () => {
            it("should handle null target attributes", () => {
                const targetWithNullAttrs = {
                    ...mockTarget,
                    attrs: null,
                } as unknown as Node;

                expect(() => {
                    imageToolbarMenuConfig(mockView, targetWithNullAttrs);
                }).not.toThrow();
            });

            it("should handle undefined target attributes", () => {
                const targetWithUndefinedAttrs = {
                    ...mockTarget,
                    attrs: undefined,
                } as unknown as Node;

                expect(() => {
                    imageToolbarMenuConfig(mockView, targetWithUndefinedAttrs);
                }).not.toThrow();
            });
        });
    });
});
