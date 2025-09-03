import {
    IToolbarInstance,
    IToolbarMenuItem,
    IToolbarSubMenuItem,
    IToolbarPosition,
    ToolbarMethods,
    CreateMenuItems,
} from "@/plugins/toolbar-plugin/types";
import { Node } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { describe, expect, it } from "vitest";
import { ToolbarInstance } from "../components";

describe("toolbar-plugin/types", () => {
    describe("IToolbarInstance", () => {
        it("should define required properties", () => {
            const mockInstance: IToolbarInstance = {
                dom: document.createElement("div"),
                update: () => {},
                show: () => {},
                hide: () => {},
                destroy: () => {},
            };

            expect(mockInstance).toHaveProperty("dom");
            expect(mockInstance).toHaveProperty("update");
            expect(mockInstance).toHaveProperty("show");
            expect(mockInstance).toHaveProperty("hide");
            expect(mockInstance).toHaveProperty("destroy");
            expect(mockInstance.dom).toBeInstanceOf(HTMLElement);
            expect(typeof mockInstance.update).toBe("function");
            expect(typeof mockInstance.show).toBe("function");
            expect(typeof mockInstance.hide).toBe("function");
            expect(typeof mockInstance.destroy).toBe("function");
        });

        it("should accept different HTML elements as dom", () => {
            const elements = [
                document.createElement("div"),
                document.createElement("span"),
                document.createElement("section"),
            ];

            elements.forEach((element) => {
                const instance: IToolbarInstance = {
                    dom: element,
                    update: () => {},
                    show: () => {},
                    hide: () => {},
                    destroy: () => {},
                };
                expect(instance.dom).toBe(element);
            });
        });
    });

    describe("IToolbarMenuItem", () => {
        it("should support minimal menu item", () => {
            const minimalItem: IToolbarMenuItem = {};

            expect(minimalItem).toBeDefined();
        });

        it("should support complete menu item", () => {
            const completeItem: IToolbarMenuItem = {
                title: "Test Item",
                class: "test-class",
                icon: "link",
                disabled: false,
                command: () => true,
                isActive: () => true,
                enabled: () => true,
                items: [{ title: "Sub Item", command: () => true }],
            };

            expect(completeItem.title).toBe("Test Item");
            expect(completeItem.class).toBe("test-class");
            expect(completeItem.icon).toBe("link");
            expect(completeItem.disabled).toBe(false);
            expect(typeof completeItem.command).toBe("function");
            expect(typeof completeItem.isActive).toBe("function");
            expect(typeof completeItem.enabled).toBe("function");
            expect(Array.isArray(completeItem.items)).toBe(true);
        });

        it("should support optional properties", () => {
            const itemWithSomeProps: IToolbarMenuItem = {
                title: "Partial Item",
                command: () => false,
            };

            expect(itemWithSomeProps.title).toBe("Partial Item");
            expect(itemWithSomeProps.class).toBeUndefined();
            expect(itemWithSomeProps.icon).toBeUndefined();
            expect(itemWithSomeProps.disabled).toBeUndefined();
            expect(itemWithSomeProps.isActive).toBeUndefined();
            expect(itemWithSomeProps.enabled).toBeUndefined();
            expect(itemWithSomeProps.items).toBeUndefined();
        });

        it("should support dropdown items", () => {
            const dropdownItem: IToolbarMenuItem = {
                title: "Dropdown",
                items: [
                    {
                        title: "Option 1",
                        command: () => true,
                        icon: "code",
                        isActive: () => false,
                    },
                    {
                        title: "Option 2",
                        command: () => true,
                        enabled: () => true,
                        run: () => true,
                    },
                ],
            };

            expect(dropdownItem.items).toHaveLength(2);
            expect(dropdownItem.items![0].title).toBe("Option 1");
            expect(dropdownItem.items![1].title).toBe("Option 2");
        });
    });

    describe("IToolbarSubMenuItem", () => {
        it("should require title and command", () => {
            const subItem: IToolbarSubMenuItem = {
                title: "Sub Item",
                command: () => true,
            };

            expect(subItem.title).toBe("Sub Item");
            expect(typeof subItem.command).toBe("function");
        });

        it("should support all optional properties", () => {
            const completeSubItem: IToolbarSubMenuItem = {
                icon: "link",
                title: "Complete Sub Item",
                command: () => true,
                run: () => false,
                isActive: () => true,
                enabled: () => false,
            };

            expect(completeSubItem.icon).toBe("link");
            expect(completeSubItem.title).toBe("Complete Sub Item");
            expect(typeof completeSubItem.command).toBe("function");
            expect(typeof completeSubItem.run).toBe("function");
            expect(typeof completeSubItem.isActive).toBe("function");
            expect(typeof completeSubItem.enabled).toBe("function");
        });

        it("should differentiate between command and run", () => {
            const subItem: IToolbarSubMenuItem = {
                title: "Test",
                command: () => true, // ProseMirror command
                run: () => false, // Custom run function
            };

            expect(subItem.command({} as EditorState)).toBe(true);
            expect(subItem.run!({} as EditorState)).toBe(false);
        });
    });

    describe("IToolbarPosition", () => {
        it("should define position properties", () => {
            const position: IToolbarPosition = {
                top: 100,
                left: 200,
            };

            expect(position.top).toBe(100);
            expect(position.left).toBe(200);
            expect(typeof position.top).toBe("number");
            expect(typeof position.left).toBe("number");
        });

        it("should support zero positions", () => {
            const zeroPosition: IToolbarPosition = {
                top: 0,
                left: 0,
            };

            expect(zeroPosition.top).toBe(0);
            expect(zeroPosition.left).toBe(0);
        });

        it("should support negative positions", () => {
            const negativePosition: IToolbarPosition = {
                top: -10,
                left: -5,
            };

            expect(negativePosition.top).toBe(-10);
            expect(negativePosition.left).toBe(-5);
        });
    });

    describe("ToolbarMethods", () => {
        it("should define createToolbar method", () => {
            const mockView = {} as EditorView;
            const mockTarget = {} as Node;
            const mockCreateMenuItems = () => [];

            const methods: ToolbarMethods = {
                createToolbar: (...options) => new ToolbarInstance(...options),
            };

            expect(methods).toHaveProperty("createToolbar");
            expect(typeof methods.createToolbar).toBe("function");

            const result = methods.createToolbar(
                mockView,
                mockTarget,
                mockCreateMenuItems,
            );
            expect(result).toBeInstanceOf(ToolbarInstance);
        });

        it("should support generic typing", () => {
            const mockView = {} as EditorView;
            const mockImageNode = { type: { name: "image" } } as Node;
            const mockCreateMenuItems = () => [];

            const methods: ToolbarMethods = {
                createToolbar: (...options) => new ToolbarInstance(...options),
            };

            const result = methods.createToolbar(
                mockView,
                mockImageNode,
                mockCreateMenuItems,
            );

            expect(result).toBeInstanceOf(ToolbarInstance);
        });
    });

    describe("CreateMenuItems", () => {
        it("should be a function type", () => {
            const mockView = {} as EditorView;
            const mockTarget = {} as Node;

            const createMenuItems: CreateMenuItems<Node> = (view, target) => {
                expect(view).toBe(mockView);
                expect(target).toBe(mockTarget);
                return [{ title: "Test Item", command: () => true }];
            };

            expect(typeof createMenuItems).toBe("function");

            const result = createMenuItems(mockView, mockTarget);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe("Test Item");
        });

        it("should support different node types", () => {
            const imageCreateMenuItems: CreateMenuItems<Node> = () => [
                { title: "Edit Image", icon: "image", command: () => true },
            ];

            const paragraphCreateMenuItems: CreateMenuItems<Node> = () => [
                {
                    title: "Format Paragraph",
                    icon: "strong",
                    command: () => true,
                },
            ];

            const mockView = {} as EditorView;
            const mockNode = {} as Node;

            const imageItems = imageCreateMenuItems(mockView, mockNode);
            const paragraphItems = paragraphCreateMenuItems(mockView, mockNode);

            expect(imageItems[0].title).toBe("Edit Image");
            expect(paragraphItems[0].title).toBe("Format Paragraph");
        });

        it("should return empty array", () => {
            const emptyCreateMenuItems: CreateMenuItems<Node> = () => [];

            const result = emptyCreateMenuItems({} as EditorView, {} as Node);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });

        it("should return complex menu structure", () => {
            const complexCreateMenuItems: CreateMenuItems<Node> = () => [
                {
                    title: "Edit",
                    icon: "link",
                    command: () => true,
                    isActive: () => false,
                },
                {
                    title: "More Options",
                    items: [
                        { title: "Copy", command: () => true },
                        {
                            title: "Delete",
                            command: () => true,
                            enabled: () => true,
                        },
                    ],
                },
            ];

            const result = complexCreateMenuItems({} as EditorView, {} as Node);
            expect(result).toHaveLength(2);
            expect(result[0].title).toBe("Edit");
            expect(result[1].title).toBe("More Options");
            expect(result[1].items).toHaveLength(2);
        });
    });

    describe("type compatibility", () => {
        it("should allow IToolbarMenuItem in arrays", () => {
            const items: IToolbarMenuItem[] = [
                { title: "Item 1" },
                { title: "Item 2", command: () => true },
                {
                    title: "Dropdown",
                    items: [{ title: "Sub 1", command: () => false }],
                },
            ];

            expect(items).toHaveLength(3);
            expect(items[0].title).toBe("Item 1");
            expect(items[2].items).toHaveLength(1);
        });

        it("should support method chaining patterns", () => {
            const instance: IToolbarInstance = {
                dom: document.createElement("div"),
                update: function () {
                    return this;
                },
                show: function () {
                    return this;
                },
                hide: function () {
                    return this;
                },
                destroy: function () {
                    return this;
                },
            };

            // These would support method chaining if implemented
            expect(instance.update).toBeDefined();
            expect(instance.show).toBeDefined();
            expect(instance.hide).toBeDefined();
        });
    });
});
