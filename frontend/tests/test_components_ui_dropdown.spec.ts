import { beforeEach, describe, expect, it, MockInstance, vi } from "vitest";
import { JSDOM } from "jsdom";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import {
    createDropdown,
    updateDropdownItemStates,
    DropdownOptions,
    DropdownItem,
} from "../components/ui/dropdown";

// Mock button component
vi.mock("../components/ui/button", () => ({
    createButton: vi.fn((options: Record<string, string>) => {
        const button = document.createElement("button");
        button.className = options.class || "table-toolbar__button";
        if (options.title) {
            button.setAttribute("title", options.title);
        }
        return button;
    }),
}));

describe("Dropdown UI Components", () => {
    let dom: JSDOM;
    let document: Document;
    let mockView: EditorView;
    let mockState: EditorState;

    beforeEach(() => {
        dom = new JSDOM(
            `<!DOCTYPE html><html><body><div class="table-toolbar"></div></body></html>`,
        );
        document = dom.window.document;
        global.document = document;
        global.window = dom.window as unknown as Window & typeof globalThis;

        mockState = {} as EditorState;
        mockView = {
            state: mockState,
            dispatch: vi.fn(),
            focus: vi.fn(),
        } as unknown as EditorView;

        vi.clearAllMocks();
    });

    describe("createDropdown", () => {
        it("should create dropdown with basic options", () => {
            const items: DropdownItem[] = [
                {
                    title: "Item 1",
                    command: vi.fn().mockReturnValue(true),
                },
            ];

            const options: DropdownOptions = {
                title: "Test Dropdown",
                items,
            };

            const dropdown = createDropdown(options, mockView);

            expect(dropdown).toBeInstanceOf(dom.window.HTMLElement);
            expect(dropdown.classList.contains("table-toolbar__dropdown")).toBe(
                true,
            );
            expect(dropdown.getAttribute("data-dropdown")).toBe(
                "Test Dropdown",
            );
        });

        it("should create dropdown with custom class", () => {
            const items: DropdownItem[] = [
                {
                    title: "Item 1",
                    command: vi.fn().mockReturnValue(true),
                },
            ];

            const options: DropdownOptions = {
                title: "Test Dropdown",
                class: "custom-dropdown",
                items,
            };

            const dropdown = createDropdown(options, mockView);
            const button = dropdown.querySelector("button");

            expect(button?.className).toContain("custom-dropdown");
            expect(button?.className).toContain(
                "table-toolbar__dropdown-button",
            );
        });

        it("should create dropdown with icon", () => {
            const items: DropdownItem[] = [
                {
                    title: "Item 1",
                    command: vi.fn().mockReturnValue(true),
                },
            ];

            const options: DropdownOptions = {
                title: "Test Dropdown",
                icon: "bold",
                items,
            };

            const dropdown = createDropdown(options, mockView);
            const button = dropdown.querySelector("button");

            expect(button?.getAttribute("title")).toBe("Test Dropdown");
        });

        it("should create dropdown items", () => {
            const items: DropdownItem[] = [
                {
                    title: "Item 1",
                    command: vi.fn().mockReturnValue(true),
                },
                {
                    title: "Item 2",
                    command: vi.fn().mockReturnValue(false),
                },
            ];

            const options: DropdownOptions = {
                title: "Test Dropdown",
                items,
            };

            const dropdown = createDropdown(options, mockView);
            const menu = dropdown.querySelector(
                ".table-toolbar__dropdown-menu",
            );
            const dropdownItems = menu?.querySelectorAll(
                ".table-toolbar__dropdown-item",
            );

            expect(dropdownItems?.length).toBe(2);
            expect(dropdownItems?.[0].textContent).toBe("Item 1");
            expect(dropdownItems?.[1].textContent).toBe("Item 2");
        });

        it("should handle dropdown item clicks", () => {
            const commandMock = vi.fn().mockReturnValue(true);
            const onCloseMock = vi.fn();

            const items: DropdownItem[] = [
                {
                    title: "Test Item",
                    command: commandMock,
                },
            ];

            const options: DropdownOptions = {
                title: "Test Dropdown",
                items,
                onClose: onCloseMock,
            };

            const dropdown = createDropdown(options, mockView);
            dropdown.classList.add("table-toolbar__dropdown--open");

            const menu = dropdown.querySelector(
                ".table-toolbar__dropdown-menu",
            );
            const item = menu?.querySelector(
                ".table-toolbar__dropdown-item",
            ) as HTMLElement;

            const clickEvent = new dom.window.MouseEvent("click", {
                bubbles: true,
            });
            const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");
            const stopPropagationSpy = vi.spyOn(clickEvent, "stopPropagation");

            item.dispatchEvent(clickEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(stopPropagationSpy).toHaveBeenCalled();
            expect(commandMock).toHaveBeenCalledWith(
                mockState,
                mockView.dispatch,
            );
            expect(mockView.focus).toHaveBeenCalled();
            expect(
                dropdown.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(false);
            expect(onCloseMock).toHaveBeenCalled();
        });

        it("should not focus when command returns false", () => {
            const commandMock = vi.fn().mockReturnValue(false);

            const items: DropdownItem[] = [
                {
                    title: "Test Item",
                    command: commandMock,
                },
            ];

            const options: DropdownOptions = {
                title: "Test Dropdown",
                items,
            };

            const dropdown = createDropdown(options, mockView);
            const menu = dropdown.querySelector(
                ".table-toolbar__dropdown-menu",
            );
            const item = menu?.querySelector(
                ".table-toolbar__dropdown-item",
            ) as HTMLElement;

            const clickEvent = new dom.window.MouseEvent("click");
            item.dispatchEvent(clickEvent);

            expect(commandMock).toHaveBeenCalledWith(
                mockState,
                mockView.dispatch,
            );
            expect(mockView.focus).not.toHaveBeenCalled();
        });

        it("should handle button clicks to toggle dropdown", () => {
            const items: DropdownItem[] = [
                {
                    title: "Item 1",
                    command: vi.fn().mockReturnValue(true),
                },
            ];

            const options: DropdownOptions = {
                title: "Test Dropdown",
                items,
            };

            // Add dropdown to container
            const container = document.querySelector(".table-toolbar")!;
            const dropdown = createDropdown(options, mockView);
            container.appendChild(dropdown);

            const button = dropdown.querySelector(
                "button",
            ) as HTMLButtonElement;

            const clickEvent = new dom.window.MouseEvent("click", {
                bubbles: true,
            });
            const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");
            const stopPropagationSpy = vi.spyOn(clickEvent, "stopPropagation");

            // Click to open
            button.dispatchEvent(clickEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(stopPropagationSpy).toHaveBeenCalled();
            expect(
                dropdown.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(true);

            // Click to close
            button.dispatchEvent(clickEvent);
            expect(
                dropdown.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(false);
        });

        it("should close other dropdowns when opening new one", () => {
            const items: DropdownItem[] = [
                {
                    title: "Item 1",
                    command: vi.fn().mockReturnValue(true),
                },
            ];

            const container = document.querySelector(".table-toolbar")!;

            // Create first dropdown
            const dropdown1 = createDropdown(
                {
                    title: "Dropdown 1",
                    items,
                },
                mockView,
            );
            dropdown1.classList.add("table-toolbar__dropdown--open");
            container.appendChild(dropdown1);

            // Create second dropdown
            const dropdown2 = createDropdown(
                {
                    title: "Dropdown 2",
                    items,
                },
                mockView,
            );
            container.appendChild(dropdown2);

            const button2 = dropdown2.querySelector(
                "button",
            ) as HTMLButtonElement;
            const clickEvent = new dom.window.MouseEvent("click");
            button2.dispatchEvent(clickEvent);

            expect(
                dropdown1.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(false);
            expect(
                dropdown2.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(true);
        });

        it("should handle dropdown without container", () => {
            const items: DropdownItem[] = [
                {
                    title: "Item 1",
                    command: vi.fn().mockReturnValue(true),
                },
            ];

            const options: DropdownOptions = {
                title: "Test Dropdown",
                items,
            };

            const dropdown = createDropdown(options, mockView);
            const button = dropdown.querySelector(
                "button",
            ) as HTMLButtonElement;

            // Should not throw error when container is not found
            const clickEvent = new dom.window.MouseEvent("click");
            expect(() => button.dispatchEvent(clickEvent)).not.toThrow();

            expect(
                dropdown.classList.contains("table-toolbar__dropdown--open"),
            ).toBe(true);
        });
    });

    describe("updateDropdownItemStates", () => {
        let dropdown: HTMLElement;
        let items: DropdownItem[];

        beforeEach(() => {
            const commandMock1 = vi.fn();
            const commandMock2 = vi.fn();
            const isActiveMock1 = vi.fn();

            items = [
                {
                    title: "Item 1",
                    command: commandMock1,
                    isActive: isActiveMock1,
                },
                {
                    title: "Item 2",
                    command: commandMock2,
                },
            ];

            dropdown = createDropdown(
                {
                    title: "Test Dropdown",
                    items,
                },
                mockView,
            );
        });

        it("should update item states correctly", () => {
            const [item1, item2] = items;

            (item1.command as unknown as MockInstance).mockReturnValue(true);
            (item1.isActive as unknown as MockInstance).mockReturnValue(true);
            (item2.command as unknown as MockInstance).mockReturnValue(false);

            updateDropdownItemStates(dropdown, mockState, items);

            const menu = dropdown.querySelector(
                ".table-toolbar__dropdown-menu",
            );
            const itemElements = menu?.querySelectorAll(
                ".table-toolbar__dropdown-item",
            );

            expect(item1.command).toHaveBeenCalledWith(mockState);
            expect(item1.isActive).toHaveBeenCalledWith(mockState);
            expect(item2.command).toHaveBeenCalledWith(mockState);

            // Item 1 should be enabled and active
            expect(
                itemElements?.[0].classList.contains(
                    "table-toolbar__dropdown-item--disabled",
                ),
            ).toBe(false);
            expect(
                itemElements?.[0].classList.contains(
                    "table-toolbar__dropdown-item--active",
                ),
            ).toBe(true);

            // Item 2 should be disabled and not active
            expect(
                itemElements?.[1].classList.contains(
                    "table-toolbar__dropdown-item--disabled",
                ),
            ).toBe(true);
            expect(
                itemElements?.[1].classList.contains(
                    "table-toolbar__dropdown-item--active",
                ),
            ).toBe(false);
        });

        it("should handle items without isActive function", () => {
            const [item1, item2] = items;

            (item1.command as unknown as MockInstance).mockReturnValue(true);
            (item2.command as unknown as MockInstance).mockReturnValue(true);

            updateDropdownItemStates(dropdown, mockState, items);

            const menu = dropdown.querySelector(
                ".table-toolbar__dropdown-menu",
            );
            const itemElements = menu?.querySelectorAll(
                ".table-toolbar__dropdown-item",
            );

            // Item 2 has no isActive, should not be active
            expect(
                itemElements?.[1].classList.contains(
                    "table-toolbar__dropdown-item--active",
                ),
            ).toBe(false);
        });

        it("should handle dropdown without menu", () => {
            const dropdownWithoutMenu = document.createElement("div");
            dropdownWithoutMenu.className = "table-toolbar__dropdown";

            expect(() => {
                updateDropdownItemStates(dropdownWithoutMenu, mockState, items);
            }).not.toThrow();
        });

        it("should handle items not found in menu", () => {
            const differentItems: DropdownItem[] = [
                {
                    title: "Different Item",
                    command: vi.fn().mockReturnValue(true),
                },
            ];

            expect(() => {
                updateDropdownItemStates(dropdown, mockState, differentItems);
            }).not.toThrow();
        });

        it("should toggle classes correctly", () => {
            const [item1] = items;

            // First call - enable and activate
            (item1.command as unknown as MockInstance).mockReturnValue(true);
            (item1.isActive as unknown as MockInstance).mockReturnValue(true);

            updateDropdownItemStates(dropdown, mockState, items);

            const menu = dropdown.querySelector(
                ".table-toolbar__dropdown-menu",
            );
            const itemElement = menu?.querySelector(
                ".table-toolbar__dropdown-item",
            ) as HTMLElement;

            expect(
                itemElement.classList.contains(
                    "table-toolbar__dropdown-item--disabled",
                ),
            ).toBe(false);
            expect(
                itemElement.classList.contains(
                    "table-toolbar__dropdown-item--active",
                ),
            ).toBe(true);

            // Second call - disable and deactivate
            (item1.command as unknown as MockInstance).mockReturnValue(false);
            (item1.isActive as unknown as MockInstance).mockReturnValue(false);

            updateDropdownItemStates(dropdown, mockState, items);

            expect(
                itemElement.classList.contains(
                    "table-toolbar__dropdown-item--disabled",
                ),
            ).toBe(true);
            expect(
                itemElement.classList.contains(
                    "table-toolbar__dropdown-item--active",
                ),
            ).toBe(false);
        });
    });
});
