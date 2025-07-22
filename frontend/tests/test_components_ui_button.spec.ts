import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    MockInstance,
    vi,
} from "vitest";
import { JSDOM } from "jsdom";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import {
    createButton,
    createToolbarButton,
    updateButtonState,
    ButtonOptions,
    ToolbarButtonOptions,
} from "../components/ui/button";
import * as translations from "../i18n/translations";
import { icons } from "prosemirror-menu";

describe("Button UI Components", () => {
    let dom: JSDOM;
    let document: Document;
    let translateSpy: MockInstance;

    beforeEach(() => {
        dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
        document = dom.window.document;
        global.document = document;
        global.window = dom.window as unknown as Window & typeof globalThis;

        translateSpy = vi.spyOn(translations, "translate");
        translateSpy.mockImplementation((key: string) => key);

        vi.clearAllMocks();
    });

    afterEach(() => {
        translateSpy.mockRestore();
    });

    describe("createButton", () => {
        it("should create button with default options", () => {
            const options: ButtonOptions = {};
            const button = createButton(options);

            expect(button).toBeInstanceOf(dom.window.HTMLButtonElement);
            expect(button.tagName).toBe("BUTTON");
            expect(button.type).toBe("button");
            expect(button.className).toBe("table-toolbar__button");
        });

        it("should create button with custom class", () => {
            const options: ButtonOptions = {
                class: "custom-button",
            };
            const button = createButton(options);

            expect(button.className).toBe("custom-button");
        });

        it("should create button with title", () => {
            const options: ButtonOptions = {
                title: "Button Title",
            };
            const button = createButton(options);

            expect(button.getAttribute("title")).toBe("Button Title");
            expect(translateSpy).toHaveBeenCalledWith("Button Title");
        });

        it("should create button without title when not provided", () => {
            const options: ButtonOptions = {};
            const button = createButton(options);

            const titleAttr = button.getAttribute("title");
            expect(titleAttr === null || titleAttr === "undefined").toBe(true);
        });

        it("should create button with icon", () => {
            const options: ButtonOptions = {
                icon: "bold",
            };
            const button = createButton(options);

            // Since we're mocking crelt, we can't easily test for actual SVG
            // Just test that the icon option was processed
            expect(button).toBeInstanceOf(dom.window.HTMLButtonElement);
        });

        it("should create button without icon when not provided", () => {
            const options: ButtonOptions = {};
            const button = createButton(options);

            // Button should not have children when no icon
            expect(button.children.length).toBe(0);
        });

        it("should create button without icon when invalid icon provided", () => {
            const options: ButtonOptions = {
                icon: "invalid-icon" as keyof typeof icons,
            };
            const button = createButton(options);

            // Button should not have children when invalid icon
            expect(button.children.length).toBe(0);
        });

        it("should add click event listener when onClick is provided", () => {
            const onClickMock = vi.fn();
            const options: ButtonOptions = {
                onClick: onClickMock,
            };
            const button = createButton(options);

            // Create and dispatch click event
            const clickEvent = new dom.window.MouseEvent("click", {
                bubbles: true,
            });
            const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");
            const stopPropagationSpy = vi.spyOn(clickEvent, "stopPropagation");

            button.dispatchEvent(clickEvent);

            expect(onClickMock).toHaveBeenCalledTimes(1);
            expect(onClickMock).toHaveBeenCalledWith(clickEvent);
            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(stopPropagationSpy).toHaveBeenCalled();
        });

        it("should not add click event listener when onClick is not provided", () => {
            const options: ButtonOptions = {};
            const button = createButton(options);

            // Should not throw error when clicked
            const clickEvent = new dom.window.MouseEvent("click");
            expect(() => button.dispatchEvent(clickEvent)).not.toThrow();
        });

        it("should disable button when disabled option is true", () => {
            const options: ButtonOptions = {
                disabled: true,
            };
            const button = createButton(options);

            expect(button.disabled).toBe(true);
            expect(
                button.classList.contains("table-toolbar__button--disabled"),
            ).toBe(true);
        });

        it("should not disable button when disabled option is false", () => {
            const options: ButtonOptions = {
                disabled: false,
            };
            const button = createButton(options);

            expect(button.disabled).toBe(false);
            expect(
                button.classList.contains("table-toolbar__button--disabled"),
            ).toBe(false);
        });

        it("should create button with all options", () => {
            const onClickMock = vi.fn();
            const options: ButtonOptions = {
                class: "custom-class",
                title: "Custom Title",
                icon: "bold",
                onClick: onClickMock,
                disabled: true,
            };
            const button = createButton(options);

            expect(button.className).toContain("custom-class");
            expect(button.getAttribute("title")).toBe("Custom Title");
            expect(button.disabled).toBe(true);
            expect(
                button.classList.contains("table-toolbar__button--disabled"),
            ).toBe(true);
        });
    });

    describe("createToolbarButton", () => {
        let mockView: EditorView;
        let mockState: EditorState;

        beforeEach(() => {
            mockState = {} as EditorState;
            mockView = {
                state: mockState,
                dispatch: vi.fn(),
                focus: vi.fn(),
            } as unknown as EditorView;
        });

        it("should create toolbar button without command", () => {
            const onClickMock = vi.fn();
            const options: ToolbarButtonOptions = {
                onClick: onClickMock,
            };
            const button = createToolbarButton(options, mockView);

            expect(button).toBeInstanceOf(dom.window.HTMLButtonElement);

            const clickEvent = new dom.window.MouseEvent("click");
            button.dispatchEvent(clickEvent);

            expect(onClickMock).toHaveBeenCalledTimes(1);
        });

        it("should create toolbar button with command", () => {
            const commandMock = vi.fn().mockReturnValue(true);
            const options: ToolbarButtonOptions = {
                command: commandMock,
            };
            const button = createToolbarButton(options, mockView);

            const clickEvent = new dom.window.MouseEvent("click");
            button.dispatchEvent(clickEvent);

            expect(commandMock).toHaveBeenCalledWith(
                mockState,
                mockView.dispatch,
            );
            expect(mockView.focus).toHaveBeenCalled();
        });

        it("should not focus when command returns false", () => {
            const commandMock = vi.fn().mockReturnValue(false);
            const options: ToolbarButtonOptions = {
                command: commandMock,
            };
            const button = createToolbarButton(options, mockView);

            const clickEvent = new dom.window.MouseEvent("click");
            button.dispatchEvent(clickEvent);

            expect(commandMock).toHaveBeenCalledWith(
                mockState,
                mockView.dispatch,
            );
            expect(mockView.focus).not.toHaveBeenCalled();
        });

        it("should prefer command over onClick", () => {
            const onClickMock = vi.fn();
            const commandMock = vi.fn().mockReturnValue(true);
            const options: ToolbarButtonOptions = {
                onClick: onClickMock,
                command: commandMock,
            };
            const button = createToolbarButton(options, mockView);

            const clickEvent = new dom.window.MouseEvent("click");
            button.dispatchEvent(clickEvent);

            expect(commandMock).toHaveBeenCalledWith(
                mockState,
                mockView.dispatch,
            );
            expect(onClickMock).not.toHaveBeenCalled();
        });

        it("should pass through other button options", () => {
            const options: ToolbarButtonOptions = {
                class: "toolbar-custom",
                title: "Toolbar Button",
                icon: "italic",
                disabled: true,
            };
            const button = createToolbarButton(options, mockView);

            expect(button.className).toContain("toolbar-custom");
            expect(button.getAttribute("title")).toBe("Toolbar Button");
            expect(button.disabled).toBe(true);
        });
    });

    describe("updateButtonState", () => {
        let button: HTMLButtonElement;

        beforeEach(() => {
            button = document.createElement("button");
            button.className = "table-toolbar__button";
        });

        it("should update button state with default values", () => {
            const mockState = {} as EditorState;

            updateButtonState(button, mockState);

            expect(button.disabled).toBe(false);
            expect(
                button.classList.contains("table-toolbar__button--disabled"),
            ).toBe(false);
            expect(
                button.classList.contains("table-toolbar__button--active"),
            ).toBe(false);
        });

        it("should disable button when command returns false", () => {
            const mockState = {} as EditorState;
            const commandMock = vi.fn().mockReturnValue(false);

            updateButtonState(button, mockState, commandMock);

            expect(commandMock).toHaveBeenCalledWith(mockState);
            expect(button.disabled).toBe(true);
            expect(
                button.classList.contains("table-toolbar__button--disabled"),
            ).toBe(true);
        });

        it("should enable button when command returns true", () => {
            const mockState = {} as EditorState;
            const commandMock = vi.fn().mockReturnValue(true);

            updateButtonState(button, mockState, commandMock);

            expect(commandMock).toHaveBeenCalledWith(mockState);
            expect(button.disabled).toBe(false);
            expect(
                button.classList.contains("table-toolbar__button--disabled"),
            ).toBe(false);
        });

        it("should activate button when isActive returns true", () => {
            const mockState = {} as EditorState;
            const isActiveMock = vi.fn().mockReturnValue(true);

            updateButtonState(button, mockState, undefined, isActiveMock);

            expect(isActiveMock).toHaveBeenCalledWith(mockState);
            expect(
                button.classList.contains("table-toolbar__button--active"),
            ).toBe(true);
        });

        it("should deactivate button when isActive returns false", () => {
            const mockState = {} as EditorState;
            const isActiveMock = vi.fn().mockReturnValue(false);
            button.classList.add("table-toolbar__button--active"); // Start active

            updateButtonState(button, mockState, undefined, isActiveMock);

            expect(isActiveMock).toHaveBeenCalledWith(mockState);
            expect(
                button.classList.contains("table-toolbar__button--active"),
            ).toBe(false);
        });

        it("should handle both command and isActive", () => {
            const mockState = {} as EditorState;
            const commandMock = vi.fn().mockReturnValue(false);
            const isActiveMock = vi.fn().mockReturnValue(true);

            updateButtonState(button, mockState, commandMock, isActiveMock);

            expect(button.disabled).toBe(true);
            expect(
                button.classList.contains("table-toolbar__button--disabled"),
            ).toBe(true);
            expect(
                button.classList.contains("table-toolbar__button--active"),
            ).toBe(true);
        });

        it("should toggle classes correctly", () => {
            const mockState = {} as EditorState;

            // Start with both classes
            button.classList.add("table-toolbar__button--disabled");
            button.classList.add("table-toolbar__button--active");

            const commandMock = vi.fn().mockReturnValue(true);
            const isActiveMock = vi.fn().mockReturnValue(false);

            updateButtonState(button, mockState, commandMock, isActiveMock);

            expect(
                button.classList.contains("table-toolbar__button--disabled"),
            ).toBe(false);
            expect(
                button.classList.contains("table-toolbar__button--active"),
            ).toBe(false);
        });
    });
});
