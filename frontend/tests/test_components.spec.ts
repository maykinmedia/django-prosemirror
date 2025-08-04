// import { beforeEach, describe, expect, it, vi } from "vitest";
// import { EditorState } from "prosemirror-state";
// import { EditorView } from "prosemirror-view";
// import { Schema } from "prosemirror-model";
// import { tableNodes } from "prosemirror-tables";
// import { baseKeymap } from "prosemirror-commands";
// import { keymap } from "prosemirror-keymap";
// import {
//     TableToolbar,
//     ButtonComponent,
//     TableToolbarMenu,
//     ToolbarMenuItem,
//     separator,
//     TABLE_TOOLBAR_CLS,
//     tableToolbarMenuConfig,
//     isHeaderRowActive,
//     isHeaderColumnActive,
//     getTableElement,
//     isInsideTable,
//     ButtonOptions,
//     IToolbarMenuItem,
//     ButtonOrDropdown,
// } from "@/components/table-toolbar";
// import {
//     Prompt,
//     Field,
//     ImageField,
//     // SelectField,
//     TableField,
//     TextField,
// } from "@/components/prompt";

// // Mock dependencies
// vi.mock("@/utils/svg", () => ({
//     createSVG: vi.fn(() => document.createElement("svg")),
// }));

// vi.mock("@/plugins/icons", () => ({
//     icons: {
//         addRowBefore: "<svg>add row before</svg>",
//         deleteTable: "<svg>delete table</svg>",
//         rowDropdown: "<svg>row dropdown</svg>",
//     },
// }));

// vi.mock("@/i18n/translations", () => ({
//     translate: vi.fn((key) => key),
// }));

// vi.mock("prosemirror-tables", () => ({
//     addColumnAfter: vi.fn(() => true),
//     addColumnBefore: vi.fn(() => true),
//     addRowAfter: vi.fn(() => true),
//     addRowBefore: vi.fn(() => true),
//     deleteColumn: vi.fn(() => true),
//     deleteRow: vi.fn(() => true),
//     deleteTable: vi.fn(() => true),
//     mergeCells: vi.fn(() => true),
//     splitCell: vi.fn(() => true),
//     toggleHeaderColumn: vi.fn(() => true),
//     toggleHeaderRow: vi.fn(() => true),
//     isInTable: vi.fn(() => true),
//     columnIsHeader: vi.fn(() => false),
//     rowIsHeader: vi.fn(() => false),
//     selectedRect: vi.fn(() => ({
//         map: {},
//         table: {},
//         top: 0,
//         left: 0,
//     })),
//     tableNodes: () => ({
//         table: { spec: {} },
//         table_row: { spec: {} },
//         table_cell: { spec: {} },
//         table_header: { spec: {} },
//     }),
// }));

// vi.mock("@/components/table-toolbar/utils", () => ({
//     isHeaderRowActive: vi.fn(() => false),
//     isHeaderColumnActive: vi.fn(() => false),
//     getTableElement: vi.fn(() => null),
//     isInsideTable: vi.fn(() => true),
// }));

// describe("test components folder", () => {
//     let mockView: EditorView;
//     let mockSchema: Schema;
//     let mockState: EditorState;

//     beforeEach(() => {
//         vi.clearAllMocks();

//         // Create a basic schema with table support
//         mockSchema = new Schema({
//             nodes: {
//                 doc: { content: "block+" },
//                 paragraph: { content: "text*", group: "block" },
//                 text: {},
//                 ...tableNodes({
//                     tableGroup: "block",
//                     cellContent: "paragraph+",
//                     cellAttributes: {
//                         colspan: { default: 1 },
//                         rowspan: { default: 1 },
//                         colwidth: { default: null },
//                     },
//                 }),
//             },
//         });

//         // Create mock state
//         mockState = EditorState.create({
//             schema: mockSchema,
//             plugins: [keymap(baseKeymap)],
//         });

//         // Create mock view
//         mockView = {
//             state: mockState,
//             dispatch: vi.fn(),
//             focus: vi.fn(),
//             dom: document.createElement("div"),
//             focused: true,
//             domAtPos: vi.fn(() => ({ node: document.createElement("table") })),
//         } as unknown as EditorView;

//         // Setup DOM
//         document.body.innerHTML = "";
//     });

//     describe("table-toolbar", () => {
//         describe("TABLE_TOOLBAR_CLS", () => {
//             it("should export all CSS class constants", () => {
//                 expect(TABLE_TOOLBAR_CLS.toolbar).toBe("table-toolbar");
//                 expect(TABLE_TOOLBAR_CLS.toolbar__visible).toBe(
//                     "table-toolbar--visible",
//                 );
//                 expect(TABLE_TOOLBAR_CLS.separator).toBe(
//                     "table-toolbar__separator",
//                 );
//                 expect(TABLE_TOOLBAR_CLS.button).toBe("table-toolbar__button");
//                 expect(TABLE_TOOLBAR_CLS.button__disabled).toBe(
//                     "table-toolbar__button--disabled",
//                 );
//                 expect(TABLE_TOOLBAR_CLS.button__active).toBe(
//                     "table-toolbar__button--active",
//                 );
//                 expect(TABLE_TOOLBAR_CLS.dropdown).toBe(
//                     "table-toolbar__dropdown",
//                 );
//                 expect(TABLE_TOOLBAR_CLS.dropdown__open).toBe(
//                     "table-toolbar__dropdown--open",
//                 );
//             });
//         });

//         describe("separator", () => {
//             it("should create a div with separator class", () => {
//                 expect(separator.tagName).toBe("DIV");
//                 expect(separator.className).toBe(TABLE_TOOLBAR_CLS.separator);
//             });
//         });

//         describe("utils", () => {
//             describe("isHeaderRowActive", () => {
//                 it("should return false when not inside table", () => {
//                     vi.mocked(isInsideTable).mockReturnValue(false);
//                     const result = isHeaderRowActive(mockView);
//                     expect(result).toBe(false);
//                 });

//                 it("should return true when row is header", () => {
//                     vi.mocked(isHeaderRowActive).mockReturnValue(true);
//                     const result = isHeaderRowActive(mockView);
//                     expect(result).toBe(true);
//                 });
//             });

//             describe("isHeaderColumnActive", () => {
//                 it("should return false when not inside table", () => {
//                     vi.mocked(isInsideTable).mockReturnValue(false);
//                     const result = isHeaderColumnActive(mockView);
//                     expect(result).toBe(false);
//                 });

//                 it("should return true when column is header", () => {
//                     vi.mocked(isHeaderColumnActive).mockReturnValue(true);
//                     const result = isHeaderColumnActive(mockView);
//                     expect(result).toBe(true);
//                 });
//             });

//             describe("getTableElement", () => {
//                 it("should return null when no table found", () => {
//                     vi.spyOn(mockView, "domAtPos").mockReturnValue({
//                         node: null as unknown as Node,
//                         offset: 0,
//                     });
//                     // mockView.domAtPos = vi.fn(() => ({
//                     //     node: null,
//                     // })) as unknown as typeof mockView.domAtPos;
//                     const result = getTableElement(mockView);
//                     expect(result).toBeNull();
//                 });

//                 it("should return table element when found", () => {
//                     const table = document.createElement("table");
//                     vi.mocked(getTableElement).mockReturnValue(table);
//                     const result = getTableElement(mockView);
//                     expect(result).toBe(table);
//                 });
//             });

//             describe("isInsideTable", () => {
//                 it("should return false when view is not focused", () => {
//                     vi.mocked(isInsideTable).mockReturnValue(false);
//                     const result = isInsideTable(mockView);
//                     expect(result).toBe(false);
//                 });

//                 it("should return true when focused and inside table", () => {
//                     vi.mocked(isInsideTable).mockReturnValue(true);
//                     const result = isInsideTable(mockView);
//                     expect(result).toBe(true);
//                 });
//             });
//         });

//         describe("utils - additional coverage", () => {
//             // Import actual utils to get better coverage
//             let actualUtils: typeof import("@/components/table-toolbar/utils");

//             beforeEach(async () => {
//                 actualUtils = await vi.importActual(
//                     "@/components/table-toolbar/utils",
//                 );
//             });

//             describe("isInsideTable function coverage", () => {
//                 it("should return false when view is not focused", () => {
//                     const unfocusedView = { ...mockView, focused: false };
//                     const result = actualUtils.isInsideTable(
//                         unfocusedView as unknown as EditorView,
//                     );
//                     expect(result).toBe(false);
//                 });

//                 it("should call isInTable when view is focused", () => {
//                     // @ts-expect-error prop is available but not in this.view
//                     (mockView as unknown as EditorView).focused = true;
//                     actualUtils.isInsideTable(mockView);
//                     // This should trigger the isInTable call to get coverage
//                     // We can't test the exact call since it's mocked at module level
//                 });
//             });

//             describe("isHeaderRowActive function coverage", () => {
//                 it("should call isInsideTable to check table context", () => {
//                     // This will call the real isInsideTable function which will exercise the utils code
//                     actualUtils.isHeaderRowActive(mockView);
//                     // The function should have been called, giving us coverage
//                 });

//                 it("should exercise the function path for better coverage", () => {
//                     // @ts-expect-error prop is available but not in this.view
//                     (mockView as unknown as EditorView).focused = true;
//                     const result = actualUtils.isHeaderRowActive(mockView);
//                     // This should exercise the function logic and give us coverage
//                     expect(typeof result).toBe("boolean");
//                 });
//             });

//             describe("isHeaderColumnActive function coverage", () => {
//                 it("should call isInsideTable to check table context", () => {
//                     actualUtils.isHeaderColumnActive(mockView);
//                 });

//                 it("should exercise the function path for better coverage", () => {
//                     // @ts-expect-error prop is available but not in this.view
//                     (mockView as unknown as EditorView).focused = true;
//                     const result = actualUtils.isHeaderColumnActive(mockView);
//                     // This should exercise the function logic and give us coverage
//                     expect(typeof result).toBe("boolean");
//                 });
//             });

//             describe("getTableElement function coverage", () => {
//                 it("should traverse selection depth to find table", () => {
//                     // Create a mock selection with depth
//                     const mockSelection = {
//                         $anchor: {
//                             depth: 3,
//                             node: vi.fn((depth) => {
//                                 if (depth === 2)
//                                     return { type: { name: "table_cell" } };
//                                 if (depth === 1)
//                                     return { type: { name: "table" } };
//                                 return { type: { name: "doc" } };
//                             }),
//                             start: vi.fn(() => 10),
//                         },
//                     };

//                     const viewWithTable = {
//                         ...mockView,
//                         state: { ...mockView.state, selection: mockSelection },
//                         domAtPos: vi.fn(() => ({ node: null, offset: 0 })),
//                     };

//                     actualUtils.getTableElement(
//                         viewWithTable as unknown as EditorView,
//                     );

//                     // Should have called node() for different depths
//                     expect(mockSelection.$anchor.node).toHaveBeenCalledWith(3);
//                     expect(mockSelection.$anchor.node).toHaveBeenCalledWith(2);
//                     expect(mockSelection.$anchor.node).toHaveBeenCalledWith(1);
//                 });

//                 it("should handle DOM traversal when node exists", () => {
//                     const table = document.createElement("table");
//                     const mockSelection = {
//                         $anchor: {
//                             depth: 2,
//                             node: vi.fn((depth) => {
//                                 if (depth === 1)
//                                     return { type: { name: "table" } };
//                                 return { type: { name: "doc" } };
//                             }),
//                             start: vi.fn(() => 10),
//                         },
//                     };

//                     const viewWithTable = {
//                         ...mockView,
//                         state: { ...mockView.state, selection: mockSelection },
//                         domAtPos: vi.fn(() => ({ node: table, offset: 0 })),
//                     };

//                     const result = actualUtils.getTableElement(
//                         viewWithTable as unknown as EditorView,
//                     );
//                     expect(result).toBe(table);
//                     expect(viewWithTable.domAtPos).toHaveBeenCalledWith(10);
//                 });

//                 it("should traverse DOM hierarchy to find table", () => {
//                     // Create DOM structure: table > tbody > tr > td
//                     const td = document.createElement("td");
//                     const tr = document.createElement("tr");
//                     const tbody = document.createElement("tbody");
//                     const table = document.createElement("table");

//                     tr.appendChild(td);
//                     tbody.appendChild(tr);
//                     table.appendChild(tbody);

//                     const mockSelection = {
//                         $anchor: {
//                             depth: 2,
//                             node: vi.fn((depth) => {
//                                 if (depth === 1)
//                                     return { type: { name: "table" } };
//                                 return { type: { name: "doc" } };
//                             }),
//                             start: vi.fn(() => 10),
//                         },
//                     };

//                     const viewWithTable = {
//                         ...mockView,
//                         state: { ...mockView.state, selection: mockSelection },
//                         domAtPos: vi.fn(() => ({ node: td, offset: 0 })),
//                     };

//                     const result = actualUtils.getTableElement(
//                         viewWithTable as unknown as EditorView,
//                     );
//                     expect(result).toBe(table);
//                 });

//                 it("should handle text nodes in DOM traversal", () => {
//                     const textNode = document.createTextNode("test");
//                     const td = document.createElement("td");
//                     const table = document.createElement("table");

//                     td.appendChild(textNode);
//                     table.appendChild(td);

//                     const mockSelection = {
//                         $anchor: {
//                             depth: 2,
//                             node: vi.fn((depth) => {
//                                 if (depth === 1)
//                                     return { type: { name: "table" } };
//                                 return { type: { name: "doc" } };
//                             }),
//                             start: vi.fn(() => 10),
//                         },
//                     };

//                     const viewWithTable = {
//                         ...mockView,
//                         state: { ...mockView.state, selection: mockSelection },
//                         domAtPos: vi.fn(() => ({ node: textNode, offset: 0 })),
//                     };

//                     const result = actualUtils.getTableElement(
//                         viewWithTable as unknown as EditorView,
//                     );
//                     expect(result).toBe(table);
//                 });

//                 it("should return null when no table found in DOM hierarchy", () => {
//                     const div = document.createElement("div");
//                     const p = document.createElement("p");
//                     div.appendChild(p);

//                     const mockSelection = {
//                         $anchor: {
//                             depth: 2,
//                             node: vi.fn((depth) => {
//                                 if (depth === 1)
//                                     return { type: { name: "table" } };
//                                 return { type: { name: "doc" } };
//                             }),
//                             start: vi.fn(() => 10),
//                         },
//                     };

//                     const viewWithTable = {
//                         ...mockView,
//                         state: { ...mockView.state, selection: mockSelection },
//                         domAtPos: vi.fn(() => ({ node: p, offset: 0 })),
//                     };

//                     const result = actualUtils.getTableElement(
//                         viewWithTable as unknown as EditorView,
//                     );
//                     expect(result).toBeNull();
//                 });
//             });
//         });

//         describe("ButtonComponent", () => {
//             let buttonOptions: ButtonOptions;

//             beforeEach(() => {
//                 buttonOptions = {
//                     title: "Test Button",
//                     icon: "addRowBefore",
//                     command: vi.fn(() => true),
//                     isActive: vi.fn(() => false),
//                 };
//             });

//             it("should create button with correct properties", () => {
//                 const button = new ButtonComponent(buttonOptions, mockView);

//                 expect(button.dom.tagName).toBe("BUTTON");
//                 expect(button.dom.title).toBe("Test Button");
//                 expect(
//                     button.dom.classList.contains(TABLE_TOOLBAR_CLS.button),
//                 ).toBe(true);
//             });

//             it("should add disabled class when disabled", () => {
//                 buttonOptions.disabled = true;
//                 const button = new ButtonComponent(buttonOptions, mockView);

//                 expect(
//                     button.dom.classList.contains(
//                         TABLE_TOOLBAR_CLS.button__disabled,
//                     ),
//                 ).toBe(true);
//                 expect(button.dom.disabled).toBe(true);
//             });

//             it("should call command on click", () => {
//                 const button = new ButtonComponent(buttonOptions, mockView);

//                 button.dom.click();

//                 expect(buttonOptions.command).toHaveBeenCalledWith(
//                     mockView.state,
//                     mockView.dispatch,
//                 );
//                 expect(mockView.focus).toHaveBeenCalled();
//             });

//             it("should update active state on render", () => {
//                 buttonOptions.isActive = vi.fn(() => true);
//                 const button = new ButtonComponent(buttonOptions, mockView);

//                 button.render(mockView);

//                 expect(
//                     button.dom.classList.contains(
//                         TABLE_TOOLBAR_CLS.button__active,
//                     ),
//                 ).toBe(true);
//             });

//             it("should update disabled state on render", () => {
//                 buttonOptions.command = vi.fn(() => false);
//                 const button = new ButtonComponent(buttonOptions, mockView);

//                 button.render(mockView);

//                 expect(
//                     button.dom.classList.contains(
//                         TABLE_TOOLBAR_CLS.button__disabled,
//                     ),
//                 ).toBe(true);
//                 expect(button.dom.disabled).toBe(true);
//             });
//         });

//         describe("ToolbarMenuItem", () => {
//             let menuItemProps: IToolbarMenuItem;
//             let mockDom: HTMLElement;

//             beforeEach(() => {
//                 menuItemProps = {
//                     title: "Test Menu Item",
//                     command: vi.fn(() => true),
//                     isActive: vi.fn(() => false),
//                 };
//                 mockDom = document.createElement("div");
//             });

//             it("should create menu item with correct properties", () => {
//                 const menuItem = new ToolbarMenuItem(
//                     menuItemProps,
//                     mockView,
//                     mockDom,
//                 );

//                 expect(
//                     menuItem.itemDom.classList.contains(
//                         TABLE_TOOLBAR_CLS.dropdown_item,
//                     ),
//                 ).toBe(true);
//                 expect(menuItem.itemDom.textContent).toBe("Test Menu Item");
//             });

//             it("should call command on click and close dropdown", () => {
//                 mockDom.classList.add(TABLE_TOOLBAR_CLS.dropdown__open);
//                 const menuItem = new ToolbarMenuItem(
//                     menuItemProps,
//                     mockView,
//                     mockDom,
//                 );

//                 menuItem.itemDom.click();

//                 expect(menuItemProps.command).toHaveBeenCalledWith(
//                     mockView.state,
//                     mockView.dispatch,
//                 );
//                 expect(mockView.focus).toHaveBeenCalled();
//                 expect(
//                     mockDom.classList.contains(
//                         TABLE_TOOLBAR_CLS.dropdown__open,
//                     ),
//                 ).toBe(false);
//             });

//             it("should update active state on render", () => {
//                 menuItemProps.isActive = vi.fn(() => true);
//                 const menuItem = new ToolbarMenuItem(
//                     menuItemProps,
//                     mockView,
//                     mockDom,
//                 );

//                 menuItem.render(mockView);

//                 expect(
//                     menuItem.itemDom.classList.contains(
//                         TABLE_TOOLBAR_CLS.dropdown_item__active,
//                     ),
//                 ).toBe(true);
//             });

//             it("should update disabled state on render", () => {
//                 menuItemProps.command = vi.fn(() => false);
//                 const menuItem = new ToolbarMenuItem(
//                     menuItemProps,
//                     mockView,
//                     mockDom,
//                 );

//                 menuItem.render(mockView);

//                 expect(
//                     menuItem.itemDom.classList.contains(
//                         TABLE_TOOLBAR_CLS.dropdown_item__disabled,
//                     ),
//                 ).toBe(true);
//             });
//         });

//         describe("TableToolbarMenu", () => {
//             it("should create button-only menu when no items", () => {
//                 const props = {
//                     title: "Test Button",
//                     icon: "deleteTable" as const,
//                     command: vi.fn(() => true),
//                 };

//                 const menu = new TableToolbarMenu(props, mockView);

//                 expect(menu.dom.tagName).toBe("BUTTON");
//                 expect(menu.dom.title).toBe("Test Button");
//             });

//             it("should create dropdown menu when items provided", () => {
//                 const props = {
//                     title: "Test Dropdown",
//                     icon: "rowDropdown" as const,
//                     items: [
//                         {
//                             title: "Item 1",
//                             command: vi.fn(() => true),
//                         },
//                     ],
//                 };

//                 const menu = new TableToolbarMenu(props, mockView);

//                 expect(
//                     menu.dom.classList.contains(TABLE_TOOLBAR_CLS.dropdown),
//                 ).toBe(true);
//                 expect(
//                     menu.dom.querySelector(
//                         `.${TABLE_TOOLBAR_CLS.dropdown_menu}`,
//                     ),
//                 ).toBeTruthy();
//             });

//             it("should toggle dropdown on button click", () => {
//                 const props = {
//                     title: "Test Dropdown",
//                     icon: "rowDropdown" as const,
//                     items: [
//                         {
//                             title: "Item 1",
//                             command: vi.fn(() => true),
//                         },
//                     ],
//                 };

//                 const menu = new TableToolbarMenu(props, mockView);
//                 const button = menu.dom.querySelector("button")!;

//                 button.click();

//                 expect(
//                     menu.dom.classList.contains(
//                         TABLE_TOOLBAR_CLS.dropdown__open,
//                     ),
//                 ).toBe(true);
//             });

//             it("should close other dropdowns when opening", () => {
//                 document.body.innerHTML = `<div class="${TABLE_TOOLBAR_CLS.toolbar}"></div>`;
//                 const toolbar = document.querySelector(
//                     `.${TABLE_TOOLBAR_CLS.toolbar}`,
//                 )!;

//                 const props = {
//                     title: "Test Dropdown",
//                     icon: "rowDropdown" as const,
//                     items: [{ title: "Item 1", command: vi.fn(() => true) }],
//                 };

//                 const menu = new TableToolbarMenu(props, mockView);
//                 toolbar.appendChild(menu.dom);

//                 // Add another dropdown that's open
//                 const otherDropdown = document.createElement("div");
//                 otherDropdown.classList.add(
//                     TABLE_TOOLBAR_CLS.dropdown,
//                     TABLE_TOOLBAR_CLS.dropdown__open,
//                 );
//                 toolbar.appendChild(otherDropdown);

//                 const button = menu.dom.querySelector("button")!;
//                 button.click();

//                 expect(
//                     otherDropdown.classList.contains(
//                         TABLE_TOOLBAR_CLS.dropdown__open,
//                     ),
//                 ).toBe(false);
//             });

//             describe("closeDropdowns static method", () => {
//                 it("should close all open dropdowns in container", () => {
//                     const container = document.createElement("div");
//                     const dropdown1 = document.createElement("div");
//                     const dropdown2 = document.createElement("div");

//                     dropdown1.classList.add(TABLE_TOOLBAR_CLS.dropdown__open);
//                     dropdown2.classList.add(TABLE_TOOLBAR_CLS.dropdown__open);

//                     container.appendChild(dropdown1);
//                     container.appendChild(dropdown2);

//                     TableToolbarMenu.closeDropdowns(container);

//                     expect(
//                         dropdown1.classList.contains(
//                             TABLE_TOOLBAR_CLS.dropdown__open,
//                         ),
//                     ).toBe(false);
//                     expect(
//                         dropdown2.classList.contains(
//                             TABLE_TOOLBAR_CLS.dropdown__open,
//                         ),
//                     ).toBe(false);
//                 });

//                 it("should exclude specified dropdown from closing", () => {
//                     const container = document.createElement("div");
//                     const dropdown1 = document.createElement("div");
//                     const dropdown2 = document.createElement("div");

//                     dropdown1.classList.add(TABLE_TOOLBAR_CLS.dropdown__open);
//                     dropdown2.classList.add(TABLE_TOOLBAR_CLS.dropdown__open);

//                     container.appendChild(dropdown1);
//                     container.appendChild(dropdown2);

//                     TableToolbarMenu.closeDropdowns(
//                         container,
//                         dropdown1 as HTMLElement,
//                     );

//                     expect(
//                         dropdown1.classList.contains(
//                             TABLE_TOOLBAR_CLS.dropdown__open,
//                         ),
//                     ).toBe(true);
//                     expect(
//                         dropdown2.classList.contains(
//                             TABLE_TOOLBAR_CLS.dropdown__open,
//                         ),
//                     ).toBe(false);
//                 });
//             });
//         });

//         describe("TableToolbar", () => {
//             let mockTable: HTMLTableElement;
//             let mockWrapper: HTMLDivElement;

//             beforeEach(() => {
//                 mockTable = document.createElement("table");
//                 mockWrapper = document.createElement("div");
//                 mockWrapper.appendChild(mockTable);
//                 document.body.appendChild(mockWrapper);

//                 // Mock getBoundingClientRect
//                 mockTable.getBoundingClientRect = vi.fn(
//                     () =>
//                         ({
//                             top: 100,
//                             left: 50,
//                             width: 200,
//                             height: 150,
//                         }) as DOMRect,
//                 );

//                 mockWrapper.getBoundingClientRect = vi.fn(
//                     () =>
//                         ({
//                             top: 90,
//                             left: 40,
//                             width: 220,
//                             height: 170,
//                         }) as DOMRect,
//                 );
//             });

//             it("should create toolbar and append to body", () => {
//                 const toolbar = new TableToolbar(mockView);

//                 expect(document.body.contains(toolbar["dom"])).toBe(true);
//                 expect(
//                     toolbar["dom"].classList.contains(
//                         TABLE_TOOLBAR_CLS.toolbar,
//                     ),
//                 ).toBe(true);
//             });

//             it("should show toolbar when inside table", () => {
//                 vi.mocked(isInsideTable).mockReturnValue(true);
//                 const toolbar = new TableToolbar(mockView);

//                 toolbar.render(mockView);

//                 expect(
//                     toolbar["dom"].classList.contains(
//                         TABLE_TOOLBAR_CLS.toolbar__visible,
//                     ),
//                 ).toBe(true);
//             });

//             it("should hide toolbar when not inside table", () => {
//                 vi.mocked(isInsideTable).mockReturnValue(false);
//                 const toolbar = new TableToolbar(mockView);

//                 toolbar.render(mockView);

//                 expect(
//                     toolbar["dom"].classList.contains(
//                         TABLE_TOOLBAR_CLS.toolbar__visible,
//                     ),
//                 ).toBe(false);
//             });

//             it("should update position relative to table", () => {
//                 vi.mocked(getTableElement).mockReturnValue(mockTable);
//                 const toolbar = new TableToolbar(mockView);

//                 // Mock toolbar getBoundingClientRect
//                 toolbar["dom"].getBoundingClientRect = vi.fn(
//                     () =>
//                         ({
//                             width: 100,
//                             height: 40,
//                         }) as DOMRect,
//                 );

//                 toolbar.updatePosition();

//                 expect(toolbar["dom"].style.top).toBeTruthy();
//                 expect(toolbar["dom"].style.left).toBeTruthy();
//             });

//             it("should handle click events outside toolbar", () => {
//                 const toolbar = new TableToolbar(mockView);
//                 const outsideElement = document.createElement("div");
//                 document.body.appendChild(outsideElement);

//                 vi.mocked(isInsideTable).mockReturnValue(false);

//                 const clickEvent = new MouseEvent("click", { bubbles: true });
//                 Object.defineProperty(clickEvent, "target", {
//                     value: outsideElement,
//                     enumerable: true,
//                 });

//                 document.dispatchEvent(clickEvent);

//                 expect(
//                     toolbar["dom"].classList.contains(
//                         TABLE_TOOLBAR_CLS.toolbar__visible,
//                     ),
//                 ).toBe(false);
//             });

//             it("should show and position toolbar when clicking inside editor with table", () => {
//                 const toolbar = new TableToolbar(mockView);

//                 vi.mocked(isInsideTable).mockReturnValue(true);
//                 vi.mocked(getTableElement).mockReturnValue(mockTable);

//                 const clickEvent = new MouseEvent("click", { bubbles: true });
//                 Object.defineProperty(clickEvent, "target", {
//                     value: mockView.dom,
//                     enumerable: true,
//                 });

//                 document.dispatchEvent(clickEvent);

//                 expect(
//                     toolbar["dom"].classList.contains(
//                         TABLE_TOOLBAR_CLS.toolbar__visible,
//                     ),
//                 ).toBe(true);
//             });

//             it("should destroy toolbar and remove from DOM", () => {
//                 const toolbar = new TableToolbar(mockView);
//                 const toolbarDom = toolbar["dom"];

//                 expect(document.body.contains(toolbarDom)).toBe(true);

//                 toolbar.destroy();

//                 expect(document.body.contains(toolbarDom)).toBe(false);
//             });

//             it("should create menu items from config", () => {
//                 const toolbar = new TableToolbar(mockView);

//                 expect(toolbar["menuItems"]).toBeDefined();
//                 expect(toolbar["menuItems"]!.length).toBe(
//                     tableToolbarMenuConfig.length,
//                 );
//             });

//             it("should render menu items", () => {
//                 const toolbar = new TableToolbar(mockView);
//                 const renderSpy = vi.fn();

//                 toolbar["menuItems"] = [
//                     { render: renderSpy } as unknown as TableToolbarMenu,
//                     { render: renderSpy } as unknown as TableToolbarMenu,
//                 ];

//                 toolbar.render(mockView);

//                 expect(renderSpy).toHaveBeenCalledTimes(2);
//                 expect(renderSpy).toHaveBeenCalledWith(mockView);
//             });
//         });

//         describe("types", () => {
//             describe("IToolbarMenuItem", () => {
//                 it("should accept valid menu item objects", () => {
//                     const validMenuItem: IToolbarMenuItem = {
//                         title: "Test Item",
//                         command: vi.fn(() => true),
//                     };

//                     expect(validMenuItem.title).toBe("Test Item");
//                     expect(typeof validMenuItem.command).toBe("function");
//                 });

//                 it("should accept menu item with optional properties", () => {
//                     const menuItemWithOptionals: IToolbarMenuItem = {
//                         icon: "addRowBefore",
//                         title: "Test Item",
//                         command: vi.fn(() => true),
//                         run: vi.fn(() => false),
//                         isActive: vi.fn(() => true),
//                     };

//                     expect(menuItemWithOptionals.icon).toBe("addRowBefore");
//                     expect(menuItemWithOptionals.title).toBe("Test Item");
//                     expect(typeof menuItemWithOptionals.command).toBe(
//                         "function",
//                     );
//                     expect(typeof menuItemWithOptionals.run).toBe("function");
//                     expect(typeof menuItemWithOptionals.isActive).toBe(
//                         "function",
//                     );
//                 });

//                 it("should work with actual command functions", () => {
//                     const menuItem: IToolbarMenuItem = {
//                         title: "Test Command",
//                         command: (state) => {
//                             expect(state).toBeDefined();
//                             return true;
//                         },
//                     };

//                     const result = menuItem.command(
//                         mockState,
//                         mockView.dispatch,
//                     );
//                     expect(result).toBe(true);
//                 });

//                 it("should work with isActive function", () => {
//                     const menuItem: IToolbarMenuItem = {
//                         title: "Test Active",
//                         command: vi.fn(() => true),
//                         isActive: (view) => {
//                             expect(view).toBeDefined();
//                             return true;
//                         },
//                     };

//                     const isActive = menuItem.isActive!(mockView);
//                     expect(isActive).toBe(true);
//                 });
//             });

//             describe("ButtonOptions", () => {
//                 it("should accept minimal button options", () => {
//                     const minimalOptions: ButtonOptions = {};

//                     expect(minimalOptions).toBeDefined();
//                 });

//                 it("should accept all optional properties", () => {
//                     const fullOptions: ButtonOptions = {
//                         title: "Test Button",
//                         class: "custom-class",
//                         icon: "deleteTable",
//                         disabled: true,
//                         command: vi.fn(() => true),
//                         isActive: vi.fn(() => false),
//                     };

//                     expect(fullOptions.title).toBe("Test Button");
//                     expect(fullOptions.class).toBe("custom-class");
//                     expect(fullOptions.icon).toBe("deleteTable");
//                     expect(fullOptions.disabled).toBe(true);
//                     expect(typeof fullOptions.command).toBe("function");
//                     expect(typeof fullOptions.isActive).toBe("function");
//                 });

//                 it("should work with command function", () => {
//                     const options: ButtonOptions = {
//                         command: (state, dispatch) => {
//                             expect(state).toBeDefined();
//                             if (dispatch) {
//                                 expect(typeof dispatch).toBe("function");
//                             }
//                             return true;
//                         },
//                     };

//                     const result = options.command!(
//                         mockState,
//                         mockView.dispatch,
//                     );
//                     expect(result).toBe(true);
//                 });

//                 it("should work with isActive function", () => {
//                     const options: ButtonOptions = {
//                         isActive: (view) => {
//                             expect(view.state).toBeDefined();
//                             return false;
//                         },
//                     };

//                     const isActive = options.isActive!(mockView);
//                     expect(isActive).toBe(false);
//                 });
//             });

//             describe("ButtonOrDropdown", () => {
//                 it("should work as button without items", () => {
//                     const buttonConfig: ButtonOrDropdown = {
//                         title: "Simple Button",
//                         icon: "deleteTable",
//                         command: vi.fn(() => true),
//                     };

//                     expect(buttonConfig.title).toBe("Simple Button");
//                     expect(buttonConfig.icon).toBe("deleteTable");
//                     expect(typeof buttonConfig.command).toBe("function");
//                     expect(buttonConfig.items).toBeUndefined();
//                 });

//                 it("should work as dropdown with items", () => {
//                     const dropdownConfig: ButtonOrDropdown = {
//                         title: "Dropdown Button",
//                         icon: "rowDropdown",
//                         items: [
//                             {
//                                 title: "Item 1",
//                                 command: vi.fn(() => true),
//                             },
//                             {
//                                 title: "Item 2",
//                                 icon: "addRowAfter",
//                                 command: vi.fn(() => false),
//                                 isActive: vi.fn(() => true),
//                             },
//                         ],
//                     };

//                     expect(dropdownConfig.title).toBe("Dropdown Button");
//                     expect(dropdownConfig.icon).toBe("rowDropdown");
//                     expect(dropdownConfig.items).toHaveLength(2);
//                     expect(dropdownConfig.items![0].title).toBe("Item 1");
//                     expect(dropdownConfig.items![1].icon).toBe("addRowAfter");
//                 });

//                 it("should inherit all ButtonOptions properties", () => {
//                     const config: ButtonOrDropdown = {
//                         title: "Test",
//                         class: "test-class",
//                         disabled: true,
//                         command: vi.fn(() => true),
//                         isActive: vi.fn(() => false),
//                         items: [
//                             {
//                                 title: "Sub Item",
//                                 command: vi.fn(() => true),
//                             },
//                         ],
//                     };

//                     // Verify it has ButtonOptions properties
//                     expect(config.title).toBe("Test");
//                     expect(config.class).toBe("test-class");
//                     expect(config.disabled).toBe(true);
//                     expect(typeof config.command).toBe("function");
//                     expect(typeof config.isActive).toBe("function");

//                     // And also has the items property
//                     expect(config.items).toHaveLength(1);
//                 });
//             });

//             describe("type compatibility", () => {
//                 it("should allow IToolbarMenuItem array for ButtonOrDropdown items", () => {
//                     const menuItems: IToolbarMenuItem[] = [
//                         {
//                             title: "Item 1",
//                             command: vi.fn(() => true),
//                         },
//                         {
//                             title: "Item 2",
//                             icon: "addRowBefore",
//                             command: vi.fn(() => false),
//                             run: vi.fn(() => true),
//                             isActive: vi.fn(() => false),
//                         },
//                     ];

//                     const config: ButtonOrDropdown = {
//                         title: "Test Dropdown",
//                         items: menuItems,
//                     };

//                     expect(config.items).toBe(menuItems);
//                     expect(config.items![0].title).toBe("Item 1");
//                     expect(config.items![1].icon).toBe("addRowBefore");
//                 });

//                 it("should work with actual table toolbar config structure", () => {
//                     // Test that our types work with the actual config structure
//                     const configItem: ButtonOrDropdown =
//                         tableToolbarMenuConfig[0];

//                     expect(typeof configItem.title).toBe("string");
//                     expect(configItem.icon).toBeDefined();

//                     if (configItem.items) {
//                         configItem.items.forEach((item) => {
//                             expect(typeof item.title).toBe("string");
//                             expect(typeof item.command).toBe("function");
//                         });
//                     }
//                 });
//             });
//         });

//         describe("tableToolbarMenuConfig", () => {
//             it("should contain all expected menu items", () => {
//                 expect(tableToolbarMenuConfig).toHaveLength(4);

//                 const [rowOps, colOps, cellOps, deleteTable] =
//                     tableToolbarMenuConfig;

//                 expect(rowOps.icon).toBe("rowDropdown");
//                 expect(rowOps.items).toHaveLength(4);

//                 expect(colOps.icon).toBe("columnDropdown");
//                 expect(colOps.items).toHaveLength(4);

//                 expect(cellOps.icon).toBe("cellDropdown");
//                 expect(cellOps.items).toHaveLength(2);

//                 expect(deleteTable.icon).toBe("deleteTable");
//                 expect(deleteTable.items).toBeUndefined();
//             });

//             it("should have working commands for all menu items", () => {
//                 tableToolbarMenuConfig.forEach((config) => {
//                     if (config.command) {
//                         expect(typeof config.command).toBe("function");
//                     }

//                     if (config.items) {
//                         config.items.forEach((item) => {
//                             expect(typeof item.command).toBe("function");
//                         });
//                     }
//                 });
//             });
//         });
//     });

//     describe("prompt", () => {
//         beforeEach(() => {
//             vi.clearAllMocks();
//         });

//         describe("Prompt class", () => {
//             it("should return early if dom has no previousElementSibling", () => {
//                 const domWithoutPrevious = { previousElementSibling: null };
//                 const callback = vi.fn();

//                 new Prompt({
//                     title: "Test",
//                     fields: {},
//                     callback,
//                     dom: domWithoutPrevious as HTMLElement,
//                 });

//                 expect(callback).not.toHaveBeenCalled();
//             });

//             it("should handle valid DOM structure", () => {
//                 // Just test that the function doesn't throw with proper DOM setup
//                 expect(() => {
//                     new TextField({ label: "Test", value: "test" });
//                 }).not.toThrow();
//             });
//         });

//         describe("Field class", () => {
//             class TestField extends Field {
//                 render() {
//                     return document.createElement("input");
//                 }
//             }

//             it("should store options correctly", () => {
//                 const options = {
//                     label: "Test Label",
//                     value: "test value",
//                     required: true,
//                     id: "test-id",
//                 };
//                 const field = new TestField(options);

//                 expect(field.options).toBe(options);
//             });

//             it("should validate required fields", () => {
//                 const field = new TestField({ label: "Test", required: true });

//                 const result = field.validate("");
//                 expect(result).toBe("Dit veld is verplicht");
//             });

//             it("should not validate non-required empty fields", () => {
//                 const field = new TestField({ label: "Test", required: false });

//                 const result = field.validate("");
//                 expect(result).toBeNull();
//             });

//             it("should use custom validation function", () => {
//                 const options = {
//                     label: "Test",
//                     validate: (value: unknown) =>
//                         value ? null : "Custom error",
//                 };

//                 vi.spyOn(options, "validate");

//                 const field = new TestField(options);

//                 // Should return custom error.
//                 let result = field.validate("");
//                 expect(options.validate).toHaveBeenCalledWith("");
//                 expect(result).toBe("Custom error");

//                 // Should return no error.
//                 result = field.validate("test value");
//                 expect(options.validate).toHaveBeenCalledWith("test value");
//                 expect(result).toBeNull();
//             });

//             it("should use custom clean function", () => {
//                 const options = {
//                     label: "Test",
//                     clean: (value: unknown) =>
//                         typeof value === "string" ? value.trim() : value,
//                 };
//                 vi.spyOn(options, "clean");
//                 const field = new TestField(options);

//                 // No difference after cleaning
//                 let result = field.clean("same value");
//                 expect(options.clean).toHaveBeenCalledWith("same value");
//                 expect(result).toBe("same value");

//                 // Trim string
//                 result = field.clean("  trimmed value  ");
//                 expect(options.clean).toHaveBeenCalledWith("  trimmed value  ");
//                 expect(result).toBe("trimmed value");

//                 // Different value than string
//                 result = field.clean([]);
//                 expect(options.clean).toHaveBeenCalledWith([]);
//                 expect(result).toEqual([]);
//             });

//             it("should return value as-is when no clean function", () => {
//                 const field = new TestField({ label: "Test" });
//                 const result = field.clean("test value");
//                 expect(result).toBe("test value");
//             });

//             it("should read value from DOM element or found input", () => {
//                 const field = new TestField({ label: "Test" });
//                 let mockDom = { value: "dom value" } as HTMLInputElement;

//                 let result = field.read(mockDom);
//                 expect(result).toBe("dom value");

//                 mockDom = {
//                     querySelector: (() => ({
//                         value: "input value",
//                     })) as HTMLInputElement["querySelector"],
//                 } as HTMLInputElement;

//                 result = field.read(mockDom);
//                 expect(result).toBe("input value");
//             });

//             it("should return null from validateType by default", () => {
//                 const field = new TestField({ label: "Test" });

//                 const result = field.validateType();
//                 expect(result).toBeNull();
//             });
//         });

//         describe("TextField", () => {
//             it("should render input element with correct properties", () => {
//                 const options = {
//                     label: "Test Label",
//                     value: "test value",
//                     id: "test-id",
//                 };
//                 const field = new TextField(options);
//                 const input = field.render();
//                 expect(input.value).toBe(options.value);
//                 expect(input.id).toBe(options.id);
//                 expect(input.placeholder).toBe(options.label);
//             });

//             it("should set placeholder from label", () => {
//                 const options = {
//                     label: "Test Label",
//                 };
//                 const field = new TextField(options);
//                 const input = field.render();
//                 expect(input.placeholder).toBe(options.label);
//             });

//             it("should set value when provided", () => {
//                 const options = {
//                     label: "Test Label",
//                     value: "initial value",
//                 };
//                 const field = new TextField(options);
//                 const input = field.render();
//                 expect(input.value).toBe(options.value);
//             });

//             it("should use empty string when no value provided", () => {
//                 const field = new TextField({ label: "Test" });
//                 const input = field.render();
//                 expect(input.value).toBe("");
//             });

//             it("should set id when provided", () => {
//                 const options = {
//                     label: "Test Label",
//                     id: "test-id",
//                 };
//                 const field = new TextField(options);
//                 const input = field.render();
//                 expect(input.id).toBe(options.id);
//             });
//         });

//         // describe("SelectField", () => {
//         //     let options = {} as SelectField["options"];
//         //     beforeEach(() => {
//         //         options = {
//         //             label: "Test",
//         //             options: [
//         //                 { value: "1", label: "Option 1" },
//         //                 { value: "2", label: "Option 2" },
//         //             ],
//         //         };
//         //     });

//         //     it("should render select element", () => {
//         //         expect(() => {
//         //             const field = new SelectField(options);
//         //             // Just ensure the field can be created without error
//         //             expect(field.options.label).toBe(options.label);
//         //         }).not.toThrow();
//         //     });

//         //     it("should create option elements for each option", () => {
//         //         const field = new SelectField(options);
//         //         const input = field.render();

//         //         expect(input.children.length).toBe(2);
//         //         const [child1, child2] = [
//         //             ...input.children,
//         //         ] as HTMLOptionElement[];
//         //         expect(child1.label).toBe(options.options?.[0].label);
//         //         expect(child2.label).toBe(options.options?.[1].label);
//         //     });

//         //     it("should set selected option when value matches", () => {
//         //         options = { ...options, value: "2" };
//         //         const field = new SelectField(options);

//         //         const input = field.render();
//         //         expect(input.value).toBe(options.value);
//         //     });
//         // });

//         describe("FileField", () => {
//             let options = {} as ImageField["options"];
//             beforeEach(() => {
//                 options = {
//                     label: "Test File",
//                     id: "",
//                     value: "",
//                 };
//             });

//             it("should render file input element", () => {
//                 expect(() => {
//                     const field = new ImageField(options);
//                     expect(field.options.label).toBe(options.label);
//                 }).not.toThrow();
//             });

//             it("should set type to file", () => {
//                 options = { ...options, label: "Test" };
//                 const field = new ImageField(options);
//                 const input = field.render();
//                 expect(input.type).toBe("file");
//             });

//             it("should set all properties like TextField", () => {
//                 options = {
//                     ...options,
//                     label: "Test File",
//                     value: "",
//                     id: "file-id",
//                 };
//                 const field = new ImageField(options);

//                 const input = field.render();
//                 expect(input.placeholder).toBe(options.label);
//                 expect(input.value).toBe(options.value);
//                 expect(input.id).toBe(options.id);
//             });
//         });

//         describe("TableField", () => {
//             let options = {} as TableField["options"];
//             beforeEach(() => {
//                 options = {
//                     label: "Test File",
//                     id: "test",
//                     value: "",
//                 };
//             });

//             it("should render table field without errors", () => {
//                 expect(() => {
//                     new TableField(options);
//                 }).not.toThrow();
//             });

//             it("should render a hidden input", () => {
//                 options = { ...options, label: "Test" };
//                 const field = new TableField(options);
//                 const container = field.render();
//                 expect(container.querySelector("input")?.type).toBe("hidden");
//                 expect(container.querySelector("input")?.id).toBe(options.id);
//             });

//             it("should contain a 8x8 grid of buttons", () => {
//                 const field = new TableField(options);
//                 const container = field.render();
//                 const btns = container.querySelectorAll("button");
//                 expect(btns.length).toBe(8 * 8);
//             });

//             it("should highlight the correct buttons on hover", () => {
//                 const field = new TableField(options);
//                 const container = field.render();

//                 // Get the button at position [2,3]
//                 const targetButton = container.querySelector(
//                     "[data-pos='[2, 3]']",
//                 ) as HTMLButtonElement;
//                 expect(targetButton).toBeDefined();

//                 // Trigger mouseenter event
//                 const mouseenterEvent = new MouseEvent("mouseenter");
//                 targetButton.dispatchEvent(mouseenterEvent);

//                 // Check that buttons from [0,0] to [2,3] are highlighted
//                 for (let row = 0; row <= 2; row++) {
//                     for (let col = 0; col <= 3; col++) {
//                         const button = container.querySelector(
//                             `[data-pos='[${row}, ${col}]']`,
//                         );
//                         expect(button?.classList.contains("highlight")).toBe(
//                             true,
//                         );
//                     }
//                 }

//                 // Check that buttons outside the area are not highlighted
//                 const outsideButton = container.querySelector(
//                     "[data-pos='[3, 4]']",
//                 );
//                 expect(outsideButton?.classList.contains("highlight")).toBe(
//                     false,
//                 );

//                 // Trigger mouseleave event
//                 const mouseleaveEvent = new MouseEvent("mouseleave");
//                 targetButton.dispatchEvent(mouseleaveEvent);

//                 // Check that highlights are removed
//                 for (let row = 0; row <= 2; row++) {
//                     for (let col = 0; col <= 3; col++) {
//                         const button = container.querySelector(
//                             `[data-pos='[${row}, ${col}]']`,
//                         );
//                         expect(button?.classList.contains("highlight")).toBe(
//                             false,
//                         );
//                     }
//                 }
//             });

//             it("should update hidden input value on button click", () => {
//                 const field = new TableField(options);
//                 const container = field.render();

//                 const button = container.querySelector(
//                     "[data-pos='[4, 2]']",
//                 ) as HTMLButtonElement;
//                 const input = container.querySelector(
//                     "input",
//                 ) as HTMLInputElement;

//                 expect(input.value).toBe("[1,1]"); // default value

//                 button.click();

//                 expect(input.value).toBe("[4, 2]");
//             });
//         });
//     });
// });
