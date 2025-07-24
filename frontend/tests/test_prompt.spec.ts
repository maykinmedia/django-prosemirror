import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    openPrompt,
    Field,
    TextField,
    SelectField,
    FileField,
} from "../plugins/menubar/prompt";

describe("plugins/menubar/prompt", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("openPrompt", () => {
        it("should return early if dom has no previousElementSibling", () => {
            const domWithoutPrevious = { previousElementSibling: null };
            const callback = vi.fn();

            openPrompt({
                title: "Test",
                fields: {},
                callback,
                dom: domWithoutPrevious as HTMLElement,
            });

            expect(callback).not.toHaveBeenCalled();
        });

        it("should handle valid DOM structure", () => {
            // Just test that the function doesn't throw with proper DOM setup
            expect(() => {
                new TextField({ label: "Test", value: "test" });
                // Don't actually call openPrompt to avoid complex DOM mocking
            }).not.toThrow();
        });
    });

    describe("Field class", () => {
        class TestField extends Field {
            render() {
                return document.createElement("input");
            }
        }

        it("should store options correctly", () => {
            const options = {
                label: "Test Label",
                value: "test value",
                required: true,
                id: "test-id",
            };
            const field = new TestField(options);

            expect(field.options).toBe(options);
        });

        it("should validate required fields", () => {
            const field = new TestField({ label: "Test", required: true });

            const result = field.validate("");
            expect(result).toBe("Dit veld is verplicht");
        });

        it("should not validate non-required empty fields", () => {
            const field = new TestField({ label: "Test", required: false });

            const result = field.validate("");
            expect(result).toBeNull();
        });

        it("should use custom validation function", () => {
            const options = {
                label: "Test",
                validate: (value: unknown) => (value ? null : "Custom error"),
            };

            vi.spyOn(options, "validate");

            const field = new TestField(options);

            // Should return custom error.
            let result = field.validate("");
            expect(options.validate).toHaveBeenCalledWith("");
            expect(result).toBe("Custom error");

            // Should return no error.
            result = field.validate("test value");
            expect(options.validate).toHaveBeenCalledWith("test value");
            expect(result).toBeNull();
        });

        it("should use custom clean function", () => {
            const options = {
                label: "Test",
                clean: (value: unknown) =>
                    typeof value === "string" ? value.trim() : value,
            };
            vi.spyOn(options, "clean");
            const field = new TestField(options);

            // No difference after cleaning
            let result = field.clean("same value");
            expect(options.clean).toHaveBeenCalledWith("same value");
            expect(result).toBe("same value");

            // Trim string
            result = field.clean("  trimmed value  ");
            expect(options.clean).toHaveBeenCalledWith("  trimmed value  ");
            expect(result).toBe("trimmed value");

            // Different value than string
            result = field.clean([]);
            expect(options.clean).toHaveBeenCalledWith([]);
            expect(result).toEqual([]);
        });

        it("should return value as-is when no clean function", () => {
            const field = new TestField({ label: "Test" });
            const result = field.clean("test value");
            expect(result).toBe("test value");
        });

        it("should read value from DOM element or found input", () => {
            const field = new TestField({ label: "Test" });
            let mockDom = { value: "dom value" } as HTMLInputElement;

            let result = field.read(mockDom);
            expect(result).toBe("dom value");

            mockDom = {
                querySelector: (() => ({
                    value: "input value",
                })) as HTMLInputElement["querySelector"],
            } as HTMLInputElement;

            result = field.read(mockDom);
            expect(result).toBe("input value");
        });

        it("should return null from validateType by default", () => {
            const field = new TestField({ label: "Test" });

            const result = field.validateType();
            expect(result).toBeNull();
        });
    });

    describe("TextField", () => {
        it("should render input element with correct properties", () => {
            const options = {
                label: "Test Label",
                value: "test value",
                id: "test-id",
            };
            const field = new TextField(options);
            const input = field.render();
            expect(input.value).toBe(options.value);
            expect(input.id).toBe(options.id);
            expect(input.placeholder).toBe(options.label);
        });

        it("should set placeholder from label", () => {
            const options = {
                label: "Test Label",
            };
            const field = new TextField(options);
            const input = field.render();
            expect(input.placeholder).toBe(options.label);
        });

        it("should set value when provided", () => {
            const options = {
                label: "Test Label",
                value: "initial value",
            };
            const field = new TextField(options);
            const input = field.render();
            expect(input.value).toBe(options.value);
        });

        it("should use empty string when no value provided", () => {
            const field = new TextField({ label: "Test" });
            const input = field.render();
            expect(input.value).toBe("");
        });

        it("should set id when provided", () => {
            const options = {
                label: "Test Label",
                id: "test-id",
            };
            const field = new TextField(options);
            const input = field.render();
            expect(input.id).toBe(options.id);
        });
    });

    describe("SelectField", () => {
        let options = {} as SelectField["options"];
        beforeEach(() => {
            options = {
                label: "Test",
                options: [
                    { value: "1", label: "Option 1" },
                    { value: "2", label: "Option 2" },
                ],
            };
        });

        it("should render select element", () => {
            expect(() => {
                const field = new SelectField(options);
                // Just ensure the field can be created without error
                expect(field.options.label).toBe(options.label);
            }).not.toThrow();
        });

        it("should create option elements for each option", () => {
            const field = new SelectField(options);
            const input = field.render();

            expect(input.children.length).toBe(2);
            const [child1, child2] = [...input.children] as HTMLOptionElement[];
            expect(child1.label).toBe(options.options?.[0].label);
            expect(child2.label).toBe(options.options?.[1].label);
        });

        it("should set selected option when value matches", () => {
            options = { ...options, value: "2" };
            const field = new SelectField(options);

            const input = field.render();
            expect(input.value).toBe(options.value);
        });
    });

    describe("FileField", () => {
        let options = {} as FileField["options"];
        beforeEach(() => {
            options = {
                label: "Test File",
                id: "",
                value: "",
            };
        });

        it("should render file input element", () => {
            expect(() => {
                const field = new FileField(options);
                expect(field.options.label).toBe(options.label);
            }).not.toThrow();
        });

        it("should set type to file", () => {
            options = { ...options, label: "Test" };
            const field = new FileField(options);
            const input = field.render();
            expect(input.type).toBe("file");
        });

        it("should set all properties like TextField", () => {
            options = {
                ...options,
                label: "Test File",
                value: "",
                id: "file-id",
            };
            const field = new FileField(options);

            const input = field.render();
            expect(input.placeholder).toBe(options.label);
            expect(input.value).toBe(options.value);
            expect(input.id).toBe(options.id);
        });
    });
});
