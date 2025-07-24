import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    MockInstance,
    vi,
} from "vitest";
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

describe("Button UI Components", () => {
    let translateSpy: MockInstance;
    const expectedClasses = {
        button: "table-toolbar__button",
        disabled: "table-toolbar__button--disabled",
        active: "table-toolbar__button--active",
    };

    beforeEach(() => {
        translateSpy = vi.spyOn(translations, "translate");
        translateSpy.mockImplementation((key: string) => key);

        vi.clearAllMocks();
    });

    afterEach(() => {
        translateSpy.mockRestore();
    });

    function mockButtonClickEvent(
        target: HTMLButtonElement,
        testPrevent?: boolean,
        testPrognation?: boolean,
    ) {
        // Create and dispatch click event
        const clickEvent = new MouseEvent("click", {
            bubbles: true,
        });

        const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");
        const stopPropagationSpy = vi.spyOn(clickEvent, "stopPropagation");

        // Dispatch and expect to not throw.
        expect(() => target.dispatchEvent(clickEvent)).not.toThrow();

        if (testPrognation) expect(stopPropagationSpy).toHaveBeenCalled();
        if (testPrevent) expect(preventDefaultSpy).toHaveBeenCalled();

        return clickEvent;
    }

    describe("createButton", () => {
        it("should create button with default options", () => {
            const options = {};
            const button = createButton(options);

            expect(button).toBeInstanceOf(HTMLButtonElement);
            expect(button.tagName).toBe("BUTTON");
            expect(button.type).toBe("button");
            expect(button.className).toBe(expectedClasses.button);
        });

        it("should create button with custom class", () => {
            const options = { class: "custom-button" };
            const button = createButton(options);

            expect(button.className).toBe(options.class);
        });

        it("should create button with title", () => {
            const options = { title: "Button Title" };
            const button = createButton(options);
            expect(button.getAttribute("title")).toBe(options.title);
        });

        it("should create button without title when not provided", () => {
            const options = {};
            const button = createButton(options);

            const titleAttr = button.getAttribute("title");
            expect(titleAttr === null || titleAttr === "undefined").toBe(true);
        });

        it("should create button with icon if icon exist", () => {
            const options: ButtonOptions = { icon: "join" };
            const button = createButton(options);
            expect(button).toBeInstanceOf(HTMLButtonElement);
            // Since we're mocking crelt, we can't easily test for actual SVG
            // Just test that the icon option was processed
            expect(button.innerHTML.includes("svg")).toBe(true);
        });

        it("should create button without icon if icon doesn't exist", () => {
            const options: ButtonOptions = { icon: "undefined" as IconKeys };
            const button = createButton(options);
            expect(button).toBeInstanceOf(HTMLButtonElement);
            // Since we're mocking crelt, we can't easily test for actual SVG
            // Just test that the icon option was processed
            expect(button.innerHTML.includes("svg")).toBe(false);
        });

        it("should create button without icon when not provided", () => {
            const options: ButtonOptions = {};
            const button = createButton(options);

            // Button should not have children when no icon
            expect(button.children.length).toBe(0);
            expect(button.innerHTML.includes("svg")).toBe(false);
        });

        it("should create button without icon when invalid icon provided", () => {
            const options = { icon: "invalid-icon" as IconKeys };
            const button = createButton(options);

            // Button should not have children when invalid icon
            expect(button.children.length).toBe(0);
            expect(button.innerHTML.includes("svg")).toBe(false);
        });

        it("should add click event listener when onClick is provided", () => {
            const onClickMock = vi.fn();
            const options = { onClick: onClickMock };
            const button = createButton(options);

            // Create and dispatch click event
            const clickEvent = mockButtonClickEvent(button, true, true);
            expect(onClickMock).toHaveBeenCalledTimes(1);
            expect(onClickMock).toHaveBeenCalledWith(clickEvent);
        });

        it("should not add click event listener when onClick is not provided", () => {
            const options = {};
            const button = createButton(options);

            // Should not throw error when clicked
            mockButtonClickEvent(button);
        });

        it("should disable button when disabled option is true", () => {
            const options = { disabled: true };
            const button = createButton(options);

            expect(button.disabled).toBe(options.disabled);
            expect(button.classList.contains(expectedClasses.disabled)).toBe(
                true,
            );
        });

        it("should not disable button when disabled option is false", () => {
            const options = { disabled: false };
            const button = createButton(options);

            expect(button.disabled).toBe(options.disabled);
            expect(button.classList.contains(expectedClasses.disabled)).toBe(
                false,
            );
        });

        it("should create button with all options", () => {
            const options = {
                class: "custom-class",
                title: "Custom Title",
                icon: "bold" as IconKeys,
                onClick: vi.fn(),
                disabled: true,
            };
            const button = createButton(options);

            expect(button.className).toContain(options.class);
            expect(button.getAttribute("title")).toBe(options.title);
            expect(button.disabled).toBe(options.disabled);
            expect(button.classList.contains(expectedClasses.disabled)).toBe(
                true,
            );
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

        function mockButtonClickEvent(target: HTMLButtonElement) {
            const clickEvent = new MouseEvent("click");
            target.dispatchEvent(clickEvent);
            return clickEvent;
        }

        it("should not create toolbar button without command", () => {
            const options: ToolbarButtonOptions = {};
            const button = createToolbarButton(options, mockView);
            expect(button).toBeInstanceOf(HTMLButtonElement);
        });

        it("should create toolbar button with command", () => {
            const commandMock = vi.fn().mockReturnValue(true);
            const options: ToolbarButtonOptions = {
                command: commandMock,
            };
            const button = createToolbarButton(options, mockView);
            mockButtonClickEvent(button);
            expect(commandMock).toHaveBeenCalledWith(
                mockState,
                mockView.dispatch,
            );
            expect(mockView.focus).toHaveBeenCalled();
        });

        it("should not focus when command returns false", () => {
            const commandMock = vi.fn().mockReturnValue(false);
            const options = {
                command: commandMock,
            };
            const button = createToolbarButton(options, mockView);

            mockButtonClickEvent(button);

            expect(commandMock).toHaveBeenCalledWith(
                mockState,
                mockView.dispatch,
            );
            expect(mockView.focus).not.toHaveBeenCalled();
        });

        it("should pass through other button options", () => {
            const options = {
                class: "toolbar-custom",
                title: "Toolbar Button",
                icon: "italic" as IconKeys,
                disabled: true,
            };
            const button = createToolbarButton(options, mockView);
            expect(button.className).toContain(options.class);
            expect(button.getAttribute("title")).toBe(options.title);
            expect(button.disabled).toBe(options.disabled);
        });
    });

    describe("updateButtonState", () => {
        let button: HTMLButtonElement;

        beforeEach(() => {
            const options = { class: "table-toolbar__button" };
            button = createButton(options);
        });

        it("should update button state with default values", () => {
            const mockState = {} as EditorState;

            updateButtonState(button, mockState);

            expect(button.disabled).toBe(false);
            expect(button.classList.contains(expectedClasses.disabled)).toBe(
                false,
            );
            expect(button.classList.contains(expectedClasses.active)).toBe(
                false,
            );
        });

        it("should disable button when command returns false", () => {
            const mockState = {} as EditorState;
            const commandMock = vi.fn().mockReturnValue(false);

            updateButtonState(button, mockState, commandMock);

            expect(commandMock).toHaveBeenCalledWith(mockState);
            expect(button.disabled).toBe(true);
            expect(button.classList.contains(expectedClasses.disabled)).toBe(
                true,
            );
        });

        it("should enable button when command returns true", () => {
            const mockState = {} as EditorState;
            const commandMock = vi.fn().mockReturnValue(true);

            updateButtonState(button, mockState, commandMock);

            expect(commandMock).toHaveBeenCalledWith(mockState);
            expect(button.disabled).toBe(false);
            expect(button.classList.contains(expectedClasses.disabled)).toBe(
                false,
            );
        });

        it("should activate button when isActive returns true", () => {
            const mockState = {} as EditorState;
            const isActiveMock = vi.fn().mockReturnValue(true);

            updateButtonState(button, mockState, undefined, isActiveMock);

            expect(isActiveMock).toHaveBeenCalledWith(mockState);
            expect(button.classList.contains(expectedClasses.active)).toBe(
                true,
            );
        });

        it("should deactivate button when isActive returns false", () => {
            const mockState = {} as EditorState;
            const isActiveMock = vi.fn().mockReturnValue(false);
            button.classList.add(expectedClasses.active); // Start active

            updateButtonState(button, mockState, undefined, isActiveMock);

            expect(isActiveMock).toHaveBeenCalledWith(mockState);
            expect(button.classList.contains(expectedClasses.active)).toBe(
                false,
            );
        });

        it("should handle both command and isActive", () => {
            const mockState = {} as EditorState;
            const commandMock = vi.fn().mockReturnValue(false);
            const isActiveMock = vi.fn().mockReturnValue(true);

            updateButtonState(button, mockState, commandMock, isActiveMock);

            expect(button.disabled).toBe(true);
            expect(button.classList.contains(expectedClasses.disabled)).toBe(
                true,
            );
            expect(button.classList.contains(expectedClasses.active)).toBe(
                true,
            );
        });

        it("should toggle classes and disable correctly", () => {
            const mockState = {} as EditorState;
            const commandMock = vi.fn().mockReturnValue(true);
            const isActiveMock = vi.fn().mockReturnValue(false);

            // Start with both classes
            button.disabled = true;
            button.classList.add(expectedClasses.disabled);
            button.classList.add(expectedClasses.active);

            // Should contain values.
            expect(button.classList.contains(expectedClasses.disabled)).toBe(
                true,
            );
            expect(button.classList.contains(expectedClasses.active)).toBe(
                true,
            );
            expect(button.disabled).toBe(true);

            updateButtonState(button, mockState, commandMock, isActiveMock);

            expect(button.classList.contains(expectedClasses.disabled)).toBe(
                false,
            );
            expect(button.classList.contains(expectedClasses.active)).toBe(
                false,
            );
            expect(button.disabled).toBe(false);
        });
    });
});
