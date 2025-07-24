import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import {
    createDropdown,
    updateDropdownItemStates,
    DropdownItem,
} from "../components/ui/dropdown";

const expectedClasses = {
    dropdown: "table-toolbar__dropdown",
    dropdownOpen: "table-toolbar__dropdown--open",
    dropdownMenu: "table-toolbar__dropdown-menu",
    dropdownItem: "table-toolbar__dropdown-item",
    dropdownItemActive: "table-toolbar__dropdown-item--active",
    dropdownItemDisabled: "table-toolbar__dropdown-item--disabled",
    button: "table-toolbar__dropdown-button",
    disabled: "table-toolbar__button--disabled",
    active: "table-toolbar__button--active",
};

describe("Dropdown UI Components", () => {
    let mockView: EditorView;
    let mockState: EditorState;
    const commandMockTrue = vi.fn().mockReturnValue(true);
    const commandMockFalse = vi.fn().mockReturnValue(false);

    beforeEach(() => {
        // Add a mock table toolbar to the body.
        document.body.innerHTML = '<div class="table-toolbar"></div>';
        mockState = {} as EditorState;
        mockView = {
            state: mockState,
            dispatch: vi.fn(),
            focus: vi.fn(),
        } as unknown as EditorView;

        vi.clearAllMocks();
    });

    function mockClickEvent(
        target: HTMLElement,
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

    describe("createDropdown", () => {
        it("should create dropdown with basic options", () => {
            const items = [{ title: "Item 1", command: commandMockTrue }];
            const options = { title: "Test Dropdown", items };
            const dropdown = createDropdown(options, mockView);

            expect(dropdown).toBeInstanceOf(HTMLElement);
            expect(dropdown.classList.contains(expectedClasses.dropdown)).toBe(
                true,
            );
            expect(dropdown.dataset.dropdown).toBe(options.title);
        });

        it("should create dropdown with custom class", () => {
            const items = [{ title: "Item 1", command: commandMockTrue }];
            const options = { title: "Test Dropdown", items };
            const dropdown = createDropdown(options, mockView);

            const button = dropdown.querySelector("button");
            expect(button?.className).toContain(expectedClasses.button);
        });

        it("should create dropdown with icon", () => {
            const items = [{ title: "Item 1", command: commandMockTrue }];
            const options = {
                title: "Test Dropdown",
                icon: "bold",
                items,
            };
            const dropdown = createDropdown(options, mockView);

            const button = dropdown.querySelector("button");
            expect(button?.title).toBe(options.title);
        });

        it("should create dropdown items", () => {
            const items = [
                { title: "Item 1", command: commandMockTrue },
                { title: "Item 2", command: commandMockFalse },
            ];
            const options = { title: "Test Dropdown", items };
            const dropdown = createDropdown(options, mockView);

            const menu = dropdown.querySelector(
                `.${expectedClasses.dropdownMenu}`,
            )!;
            const dropdownItems = menu.querySelectorAll(
                `.${expectedClasses.dropdownItem}`,
            )!;

            expect(dropdownItems?.length).toBe(items.length);
            expect(dropdownItems?.[0].textContent).toBe(items[0].title);
            expect(dropdownItems?.[1].textContent).toBe(items[1].title);
        });

        it("should handle dropdown item clicks", () => {
            const items = [{ title: "Test Item", command: commandMockTrue }];
            const options = { title: "Test Dropdown", items };

            const dropdown = createDropdown(options, mockView);
            dropdown.classList.add(expectedClasses.dropdownOpen);

            const menu = dropdown.querySelector(
                `.${expectedClasses.dropdownMenu}`,
            )!;
            const item: HTMLElement = menu.querySelector(
                `.${expectedClasses.dropdownItem}`,
            )!;
            mockClickEvent(item, true, true);

            expect(commandMockTrue).toHaveBeenCalledWith(
                mockState,
                mockView.dispatch,
            );
            expect(mockView.focus).toHaveBeenCalled();
            expect(
                dropdown.classList.contains(expectedClasses.dropdownOpen),
            ).toBe(false);
        });

        it("should not focus when command returns false", () => {
            const items = [{ title: "Test Item", command: commandMockFalse }];
            const options = { title: "Test Dropdown", items };

            const dropdown = createDropdown(options, mockView);
            const menu = dropdown.querySelector(
                `.${expectedClasses.dropdownMenu}`,
            )!;
            const item: HTMLElement = menu.querySelector(
                `.${expectedClasses.dropdownItem}`,
            )!;
            mockClickEvent(item);
            expect(commandMockFalse).toHaveBeenCalledWith(
                mockState,
                mockView.dispatch,
            );
            expect(mockView.focus).not.toHaveBeenCalled();
        });

        it("should handle button clicks to toggle dropdown", () => {
            const items = [{ title: "Item 1", command: commandMockTrue }];
            const options = { title: "Test Dropdown", items };

            // Add dropdown to container
            const container = document.querySelector(".table-toolbar")!;
            const dropdown = createDropdown(options, mockView);
            container.appendChild(dropdown);

            const button = dropdown.querySelector<HTMLButtonElement>("button")!;

            mockClickEvent(button, true, true);

            expect(
                dropdown.classList.contains(expectedClasses.dropdownOpen),
            ).toBe(true);

            // Click to close
            mockClickEvent(button, true, true);

            expect(
                dropdown.classList.contains(expectedClasses.dropdownOpen),
            ).toBe(false);
        });

        it("should close other dropdowns when opening new one", () => {
            const items = [{ title: "Item 1", command: commandMockTrue }];
            const container = document.querySelector(".table-toolbar")!;

            // Create first dropdown
            const dropdown1 = createDropdown(
                { title: "Dropdown 1", items },
                mockView,
            );
            dropdown1.classList.add(expectedClasses.dropdownOpen);
            container.appendChild(dropdown1);

            // Create second dropdown
            const dropdown2 = createDropdown(
                { title: "Dropdown 2", items },
                mockView,
            );
            container.appendChild(dropdown2);

            const button2 =
                dropdown2.querySelector<HTMLButtonElement>("button")!;

            mockClickEvent(button2);

            expect(
                dropdown1.classList.contains(expectedClasses.dropdownOpen),
            ).toBe(false);
            expect(
                dropdown2.classList.contains(expectedClasses.dropdownOpen),
            ).toBe(true);
        });

        it("should handle dropdown without container", () => {
            const items = [{ title: "Item 1", command: commandMockTrue }];
            const options = { title: "Test Dropdown", items };
            const dropdown = createDropdown(options, mockView);
            const button = dropdown.querySelector<HTMLButtonElement>("button")!;

            mockClickEvent(button);

            expect(
                dropdown.classList.contains(expectedClasses.dropdownOpen),
            ).toBe(true);
        });
    });

    describe("updateDropdownItemStates", () => {
        let dropdown: HTMLElement;
        let items: DropdownItem[];

        beforeEach(() => {
            items = [
                { title: "Item 1", command: vi.fn(), isActive: vi.fn() },
                { title: "Item 2", command: vi.fn() },
            ];

            dropdown = createDropdown(
                { title: "Test Dropdown", items },
                mockView,
            );
        });

        it("should update item states correctly", () => {
            const [item1, item2] = items;

            item1.command = commandMockTrue;
            item1.isActive = commandMockTrue;
            item2.command = commandMockFalse;

            updateDropdownItemStates(dropdown, mockState, items);

            const menu = dropdown.querySelector(
                `.${expectedClasses.dropdownMenu}`,
            )!;
            const [el1, el2] = menu.querySelectorAll(
                `.${expectedClasses.dropdownItem}`,
            )!;

            expect(item1.command).toHaveBeenCalledWith(mockState);
            expect(item1.isActive).toHaveBeenCalledWith(mockState);
            expect(item2.command).toHaveBeenCalledWith(mockState);

            // Item 1 should be enabled and active
            expect(
                el1.classList.contains(expectedClasses.dropdownItemDisabled),
            ).toBe(false);
            expect(
                el1.classList.contains(expectedClasses.dropdownItemActive),
            ).toBe(true);

            // Item 2 should be disabled and not active
            expect(
                el2.classList.contains(expectedClasses.dropdownItemDisabled),
            ).toBe(true);
            expect(
                el2.classList.contains(expectedClasses.dropdownItemActive),
            ).toBe(false);
        });

        it("should handle items without isActive function", () => {
            const [item1, item2] = items;
            item1.command = commandMockTrue;
            item2.command = commandMockTrue;

            updateDropdownItemStates(dropdown, mockState, items);

            const menu = dropdown.querySelector(
                `.${expectedClasses.dropdownMenu}`,
            )!;
            const [, el2] = menu.querySelectorAll(
                `.${expectedClasses.dropdownItem}`,
            )!;

            // Item 2 has no isActive, should not be active
            expect(
                el2.classList.contains(expectedClasses.dropdownItemActive),
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
            const differentItems = [
                { title: "Different Item", command: commandMockTrue },
            ];

            expect(() => {
                updateDropdownItemStates(dropdown, mockState, differentItems);
            }).not.toThrow();
        });

        it("should toggle classes correctly", () => {
            const [item1] = items;

            // First call - enable and activate
            item1.command = commandMockTrue;
            item1.isActive = commandMockTrue;

            updateDropdownItemStates(dropdown, mockState, items);

            const menu = dropdown.querySelector(
                `.${expectedClasses.dropdownMenu}`,
            )!;
            const item: HTMLElement = menu.querySelector(
                `.${expectedClasses.dropdownItem}`,
            )!;

            expect(
                item.classList.contains(expectedClasses.dropdownItemDisabled),
            ).toBe(false);
            expect(
                item.classList.contains(expectedClasses.dropdownItemActive),
            ).toBe(true);

            // Second call - disable and deactivate
            item1.command = commandMockFalse;
            item1.isActive = commandMockFalse;

            updateDropdownItemStates(dropdown, mockState, items);

            expect(
                item.classList.contains(expectedClasses.dropdownItemDisabled),
            ).toBe(true);
            expect(
                item.classList.contains(expectedClasses.dropdownItemActive),
            ).toBe(false);
        });
    });
});
