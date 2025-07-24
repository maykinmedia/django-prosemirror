import { describe, it, expect, beforeEach, vi } from "vitest";
import { DjangoProsemirror } from "../create";
import { Node } from "prosemirror-model";

Object.defineProperty(globalThis, "window", {
    value: {},
    writable: true,
});

// Mock ProseMirror modules
vi.mock("prosemirror-view", () => ({
    EditorView: vi.fn().mockImplementation(() => ({
        state: { doc: { toJSON: () => ({ type: "doc", content: [] }) } },
        updateState: vi.fn(),
        dispatch: vi.fn(),
    })),
}));

vi.mock("prosemirror-state", () => ({
    EditorState: {
        create: vi.fn(() => ({
            doc: {
                toJSON: () => ({ type: "doc", content: [] }),
                descendants: vi.fn(),
            },
            apply: vi.fn(() => ({
                doc: {
                    toJSON: () => ({ type: "doc", content: [] }),
                    descendants: vi.fn(),
                },
            })),
        })),
    },
}));

vi.mock("prosemirror-model", () => ({
    DOMParser: {
        fromSchema: vi.fn(() => ({
            parse: vi.fn(() => ({
                toJSON: () => ({ type: "doc", content: [] }),
            })),
        })),
    },
    Schema: vi.fn(),
}));

// Mock the schema creation
vi.mock("../schema/prosemirror-schema.ts", () => ({
    default: vi.fn().mockImplementation(() => ({
        schema: {
            nodeFromJSON: vi.fn(() => ({
                toJSON: () => ({ type: "doc", content: [] }),
            })),
            nodes: {},
            marks: {},
        },
    })),
}));

vi.mock("../plugins/index.ts", () => ({
    getDjangoProsemirrorPlugins: vi.fn(() => []),
    getDPMPlugins: vi.fn(() => []),
}));

vi.mock("../i18n/translations.ts", () => ({
    translate: vi.fn((text) => text),
}));

describe("DjangoProsemirror", () => {
    let mockInputElement: HTMLInputElement;
    let mockEditorElement: HTMLDivElement;

    beforeEach(() => {
        vi.clearAllMocks();

        mockInputElement = {
            id: "test-id",
            value: '{"type":"doc","content":[]}',
        } as HTMLInputElement;

        mockEditorElement = {
            id: "test-id-editor",
            innerHTML: "<p>Test content</p>",
            dataset: {
                prosemirrorInputId: "test-id",
                allowedMarks: "[]",
                allowedNodes: "[]",
            },
        } as unknown as HTMLDivElement;

        document.querySelector = vi.fn().mockReturnValue(mockInputElement);
    });

    describe("Constructor", () => {
        it("should initialize with editor element and settings", () => {
            const editor = new DjangoProsemirror(mockEditorElement);

            expect(editor.editorElement).toBe(mockEditorElement);
            expect(editor.inputElement).toBe(mockInputElement);
        });

        it("should initialize without settings", () => {
            const editor = new DjangoProsemirror(mockEditorElement);

            expect(editor.editorElement).toBe(mockEditorElement);
            expect(editor.inputElement).toBe(mockInputElement);
            expect(editor.settings).toBeDefined();
        });

        it("should log initialization when debug is enabled", () => {
            const consoleSpy = vi
                .spyOn(console, "debug")
                .mockImplementation(() => {});

            new DjangoProsemirror(mockEditorElement);

            expect(consoleSpy).toHaveBeenCalledTimes(1);
            consoleSpy.mockRestore();
        });
    });

    describe("Getters", () => {
        let editor: DjangoProsemirror;

        beforeEach(() => {
            editor = new DjangoProsemirror(mockEditorElement);
        });

        it("should return input element from DOM", () => {
            expect(editor.inputElement).toBe(mockInputElement);
            expect(document.querySelector).toHaveBeenCalledTimes(4);
        });
    });

    describe("initialDoc", () => {
        let editor: DjangoProsemirror;

        beforeEach(() => {
            editor = new DjangoProsemirror(mockEditorElement);
        });

        it("should parse JSON from input value when available", () => {
            mockInputElement.value =
                '{"type":"doc","content":[{"type":"paragraph"}]}';

            const doc = editor.initialDoc;

            expect(doc).toBeDefined();
        });

        it("should fall back to DOM parsing when input is empty", () => {
            mockInputElement.value = "";

            const doc = editor.initialDoc;

            expect(doc).toBeDefined();
        });

        it("should fall back to DOM parsing when JSON is invalid", () => {
            mockInputElement.value = "invalid-json";

            const doc = editor.initialDoc;

            expect(doc).toBeDefined();
        });

        it("should log warning when debug is enabled and JSON parsing fails", () => {
            const consoleWarnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            const editor = new DjangoProsemirror(mockEditorElement);
            mockInputElement.value = "invalid-json";

            const doc = editor.initialDoc;
            expect(doc).toBeDefined();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Failed to parse JSON from input, falling back to DOM parsing:",
                expect.any(Error),
            );
            consoleWarnSpy.mockRestore();
        });
    });

    describe("updateFormInputValue", () => {
        let editor: DjangoProsemirror;

        beforeEach(() => {
            editor = new DjangoProsemirror(mockEditorElement);
        });

        it("should update input value with document JSON", () => {
            const mockDoc = {
                toJSON: vi.fn(() => ({ type: "doc", content: [] })),
            } as unknown as Node;

            editor.updateFormInputValue(mockDoc);
            expect(mockInputElement.value).toBe(
                JSON.stringify({ type: "doc", content: [] }, null, 2),
            );
        });

        it("should log debug message when debug is enabled", () => {
            const consoleDebugSpy = vi
                .spyOn(console, "debug")
                .mockImplementation(() => {});

            const editor = new DjangoProsemirror(mockEditorElement);
            const mockDoc = {
                toJSON: vi.fn(() => ({ type: "doc", content: [] })),
            } as unknown as Node;

            const expectedJson = JSON.stringify(
                { type: "doc", content: [] },
                null,
                2,
            );

            editor.updateFormInputValue(mockDoc);

            expect(consoleDebugSpy).toHaveBeenCalledWith(
                "Setting value to",
                expectedJson,
            );
            consoleDebugSpy.mockRestore();
        });
    });

    describe("create", () => {
        it("should throw error when input element is not found", () => {
            document.querySelector = vi.fn().mockReturnValue(null);

            expect(() => {
                new DjangoProsemirror(mockEditorElement);
            }).toThrow(
                "You must specify an input element to hold the editor state",
            );
        });

        it("should throw error when editor element is null", () => {
            expect(() => {
                new DjangoProsemirror(null as unknown as HTMLDivElement);
            }).toThrow(
                "You must specify an element in which to mount prose mirror",
            );
        });

        it("should log debug information when debug is enabled", () => {
            const consoleDebugSpy = vi
                .spyOn(console, "debug")
                .mockImplementation(() => {});

            new DjangoProsemirror(mockEditorElement);

            expect(consoleDebugSpy).toHaveBeenCalledWith(
                "Editor element:",
                mockEditorElement,
                "Input element:",
                mockInputElement,
                "Editor schema:",
                expect.anything(),
            );
            consoleDebugSpy.mockRestore();
        });

        it("should create editor view with proper configuration", () => {
            expect(() => {
                new DjangoProsemirror(mockEditorElement);
            }).not.toThrow();
        });
    });

    describe("Edge cases", () => {
        it("should handle missing dataset properties gracefully", () => {
            const editorWithoutDataset = {} as HTMLDivElement;
            expect(() => {
                new DjangoProsemirror(editorWithoutDataset);
            }).toThrow(); // Should throw when input element is not found
        });
    });
});
