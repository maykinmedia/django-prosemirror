import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditorView } from "prosemirror-view";
import {
    closeDropdowns,
    setupDocumentClickHandler,
} from "../components/floating-table-toolbar/utils/dom-helpers";

describe("DOM Helpers", () => {
    let container: HTMLElement;

    function dispatchClickEventHelper(target: Node) {
        const clickEvent = new MouseEvent("click", {
            bubbles: true,
        });
        Object.defineProperty(clickEvent, "target", {
            value: target,
            configurable: true,
        });
        target.dispatchEvent(clickEvent);
    }

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="container" class="table-toolbar">
                <div class="table-toolbar__dropdown table-toolbar__dropdown--open" id="dropdown1">
                    Dropdown 1
                </div>
                <div class="table-toolbar__dropdown table-toolbar__dropdown--open" id="dropdown2">
                    Dropdown 2
                </div>
                <div class="table-toolbar__dropdown" id="dropdown3">
                    Dropdown 3
                </div>
            </div>
            <div id="editor-view">Editor View</div>
            <div id="outside">Outside Element</div>
        `;

        container = document.getElementById("container")!;

        vi.clearAllMocks();
    });

    describe("closeDropdowns", () => {
        it("should close all open dropdowns in container", () => {
            const dropdown1 = document.getElementById("dropdown1")!;
            const dropdown2 = document.getElementById("dropdown2")!;
            const dropdown3 = document.getElementById("dropdown3")!;

            expect(
                dropdown1.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(true);
            expect(
                dropdown2.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(true);
            expect(
                dropdown3.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(false);

            closeDropdowns(container);

            expect(
                dropdown1.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(false);
            expect(
                dropdown2.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(false);
            expect(
                dropdown3.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(false);
        });

        it("should close all open dropdowns except specified element", () => {
            const dropdown1 = document.getElementById("dropdown1")!;
            const dropdown2 = document.getElementById("dropdown2")!;

            expect(
                dropdown1.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(true);
            expect(
                dropdown2.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(true);

            closeDropdowns(container, dropdown1);

            expect(
                dropdown1.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(true);
            expect(
                dropdown2.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(false);
        });

        it("should handle container with no open dropdowns", () => {
            const emptyContainer = document.createElement("div");
            emptyContainer.className = "table-toolbar";

            // Should not throw error
            expect(() => closeDropdowns(emptyContainer)).not.toThrow();
        });

        it("should handle container with no dropdowns at all", () => {
            const emptyContainer = document.createElement("div");

            // Should not throw error
            expect(() => closeDropdowns(emptyContainer)).not.toThrow();
        });
    });

    describe("setupDocumentClickHandler", () => {
        let mockView: EditorView;
        let onHideMock: ReturnType<typeof vi.fn>;
        let onShowMock: ReturnType<typeof vi.fn>;
        let onPositionMock: ReturnType<typeof vi.fn>;
        let isInsideTableMock: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            const editorViewElement = document.getElementById("editor-view")!;
            mockView = {
                dom: editorViewElement,
            } as unknown as EditorView;

            onHideMock = vi.fn();
            onShowMock = vi.fn();
            onPositionMock = vi.fn();
            isInsideTableMock = vi.fn();
        });

        it("should set up document click handler", () => {
            const addEventListenerSpy = vi.spyOn(document, "addEventListener");

            setupDocumentClickHandler(
                container,
                mockView,
                onHideMock,
                onShowMock,
                onPositionMock,
                isInsideTableMock,
            );

            expect(addEventListenerSpy).toHaveBeenCalledWith(
                "click",
                expect.any(Function),
            );

            addEventListenerSpy.mockRestore();
        });

        it("should close dropdowns when clicking outside container", () => {
            setupDocumentClickHandler(
                container,
                mockView,
                onHideMock,
                onShowMock,
                onPositionMock,
                isInsideTableMock,
            );

            const outsideElement = document.getElementById("outside")!;
            const dropdown1 = document.getElementById("dropdown1")!;
            const dropdown2 = document.getElementById("dropdown2")!;

            expect(
                dropdown1.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(true);
            expect(
                dropdown2.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(true);
            dispatchClickEventHelper(outsideElement);
            expect(
                dropdown1.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(false);
            expect(
                dropdown2.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(false);
        });

        it("should call onHide when clicking outside container and editor view", () => {
            isInsideTableMock.mockReturnValue(false);

            setupDocumentClickHandler(
                container,
                mockView,
                onHideMock,
                onShowMock,
                onPositionMock,
                isInsideTableMock,
            );

            const outsideElement = document.getElementById("outside")!;
            dispatchClickEventHelper(outsideElement);
            expect(onHideMock).toHaveBeenCalledTimes(1);
            expect(onShowMock).not.toHaveBeenCalled();
            expect(onPositionMock).not.toHaveBeenCalled();
        });

        it("should call onShow and onPosition when clicking inside editor and inside table", () => {
            isInsideTableMock.mockReturnValue(true);

            setupDocumentClickHandler(
                container,
                mockView,
                onHideMock,
                onShowMock,
                onPositionMock,
                isInsideTableMock,
            );

            const editorElement = document.getElementById("editor-view")!;
            dispatchClickEventHelper(editorElement);

            expect(onHideMock).not.toHaveBeenCalled();
            expect(onShowMock).toHaveBeenCalledTimes(1);
            expect(onPositionMock).toHaveBeenCalledTimes(1);
        });

        it("should not call onShow/onPosition when clicking inside editor but outside table", () => {
            isInsideTableMock.mockReturnValue(false);

            setupDocumentClickHandler(
                container,
                mockView,
                onHideMock,
                onShowMock,
                onPositionMock,
                isInsideTableMock,
            );

            const editorElement = document.getElementById("editor-view")!;
            dispatchClickEventHelper(editorElement);

            expect(onHideMock).not.toHaveBeenCalled();
            expect(onShowMock).not.toHaveBeenCalled();
            expect(onPositionMock).not.toHaveBeenCalled();
        });

        it("should not call onHide when clicking inside container", () => {
            isInsideTableMock.mockReturnValue(false);

            setupDocumentClickHandler(
                container,
                mockView,
                onHideMock,
                onShowMock,
                onPositionMock,
                isInsideTableMock,
            );

            const insideElement = document.getElementById("dropdown1")!;
            dispatchClickEventHelper(insideElement);

            expect(onHideMock).not.toHaveBeenCalled();
        });

        it("should not close dropdowns when clicking inside container", () => {
            setupDocumentClickHandler(
                container,
                mockView,
                onHideMock,
                onShowMock,
                onPositionMock,
                isInsideTableMock,
            );

            const insideElement = document.getElementById("dropdown1")!;
            const dropdown1 = document.getElementById("dropdown1")!;
            const dropdown2 = document.getElementById("dropdown2")!;

            expect(
                dropdown1.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(true);
            expect(
                dropdown2.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(true);

            dispatchClickEventHelper(insideElement);

            // Dropdowns should remain open
            expect(
                dropdown1.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(true);
            expect(
                dropdown2.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(true);
        });

        it("should handle multiple click events correctly", () => {
            isInsideTableMock.mockReturnValue(true);

            setupDocumentClickHandler(
                container,
                mockView,
                onHideMock,
                onShowMock,
                onPositionMock,
                isInsideTableMock,
            );

            const editorElement = document.getElementById("editor-view")!;
            const outsideElement = document.getElementById("outside")!;

            // Click inside editor (inside table)
            dispatchClickEventHelper(editorElement);
            expect(onShowMock).toHaveBeenCalledTimes(1);
            expect(onPositionMock).toHaveBeenCalledTimes(1);

            // Click outside
            isInsideTableMock.mockReturnValue(false);
            dispatchClickEventHelper(outsideElement);
            expect(onHideMock).toHaveBeenCalledTimes(1);

            // Final counts
            expect(onShowMock).toHaveBeenCalledTimes(1);
            expect(onPositionMock).toHaveBeenCalledTimes(1);
            expect(onHideMock).toHaveBeenCalledTimes(1);
        });
    });
});
