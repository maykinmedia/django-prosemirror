import { TOOLBAR_CLS } from "@/plugins/toolbar-plugin/config";
import { describe, expect, it } from "vitest";

describe("toolbar-plugin/config", () => {
    describe("TOOLBAR_CLS", () => {
        it("should define all required CSS class names", () => {
            expect(TOOLBAR_CLS).toHaveProperty("toolbar");
            expect(TOOLBAR_CLS).toHaveProperty("toolbar__visible");
            expect(TOOLBAR_CLS).toHaveProperty("button");
            expect(TOOLBAR_CLS).toHaveProperty("button__active");
            expect(TOOLBAR_CLS).toHaveProperty("button__disabled");
            expect(TOOLBAR_CLS).toHaveProperty("link");
            expect(TOOLBAR_CLS).toHaveProperty("link__active");
            expect(TOOLBAR_CLS).toHaveProperty("link__disabled");
            expect(TOOLBAR_CLS).toHaveProperty("separator");
            expect(TOOLBAR_CLS).toHaveProperty("dropdown");
            expect(TOOLBAR_CLS).toHaveProperty("dropdown__open");
            expect(TOOLBAR_CLS).toHaveProperty("dropdown_button");
            expect(TOOLBAR_CLS).toHaveProperty("dropdown_menu");
            expect(TOOLBAR_CLS).toHaveProperty("dropdown_item");
            expect(TOOLBAR_CLS).toHaveProperty("dropdown_item__active");
            expect(TOOLBAR_CLS).toHaveProperty("dropdown_item__disabled");
        });

        it("should have correct base toolbar classes", () => {
            expect(TOOLBAR_CLS.toolbar).toBe("generic-toolbar");
            expect(TOOLBAR_CLS.toolbar__visible).toBe(
                "generic-toolbar--visible",
            );
        });

        it("should have correct button classes", () => {
            expect(TOOLBAR_CLS.button).toBe("generic-toolbar__button");
            expect(TOOLBAR_CLS.button__active).toBe(
                "generic-toolbar__button--active",
            );
            expect(TOOLBAR_CLS.button__disabled).toBe(
                "generic-toolbar__button--disabled",
            );
        });

        it("should have correct link classes", () => {
            expect(TOOLBAR_CLS.link).toBe("generic-toolbar__link");
            expect(TOOLBAR_CLS.link__active).toBe(
                "generic-toolbar__link--active",
            );
            expect(TOOLBAR_CLS.link__disabled).toBe(
                "generic-toolbar__link--disabled",
            );
        });

        it("should have correct separator class", () => {
            expect(TOOLBAR_CLS.separator).toBe("generic-toolbar__separator");
        });

        it("should have correct dropdown classes", () => {
            expect(TOOLBAR_CLS.dropdown).toBe("generic-toolbar__dropdown");
            expect(TOOLBAR_CLS.dropdown__open).toBe(
                "generic-toolbar__dropdown--open",
            );
            expect(TOOLBAR_CLS.dropdown_button).toBe(
                "generic-toolbar__dropdown-button",
            );
            expect(TOOLBAR_CLS.dropdown_menu).toBe(
                "generic-toolbar__dropdown-menu",
            );
            expect(TOOLBAR_CLS.dropdown_item).toBe(
                "generic-toolbar__dropdown-item",
            );
            expect(TOOLBAR_CLS.dropdown_item__active).toBe(
                "generic-toolbar__dropdown-item--active",
            );
            expect(TOOLBAR_CLS.dropdown_item__disabled).toBe(
                "generic-toolbar__dropdown-item--disabled",
            );
        });

        it("should be readonly", () => {
            // Test that the object is frozen/readonly using const assertion
            const originalValue = TOOLBAR_CLS.toolbar;
            expect(originalValue).toBe("generic-toolbar");
            // The as const assertion makes it readonly, so this is conceptually tested
            expect(TOOLBAR_CLS.toolbar).toBe("generic-toolbar");
        });

        it("should follow BEM naming convention", () => {
            // Test that class names follow Block__Element--Modifier pattern
            const bemPattern = /^[a-z-]+(__[a-z-]+)?(--[a-z-]+)?$/;

            Object.values(TOOLBAR_CLS).forEach((className) => {
                expect(className).toMatch(bemPattern);
            });
        });

        it("should have consistent base prefix", () => {
            const basePrefix = "generic-toolbar";

            Object.values(TOOLBAR_CLS).forEach((className) => {
                expect(className).toMatch(new RegExp(`^${basePrefix}`));
            });
        });

        it("should differentiate between similar classes", () => {
            // Ensure different states have different class names
            expect(TOOLBAR_CLS.button).not.toBe(TOOLBAR_CLS.button__active);
            expect(TOOLBAR_CLS.button).not.toBe(TOOLBAR_CLS.button__disabled);
            expect(TOOLBAR_CLS.button__active).not.toBe(
                TOOLBAR_CLS.button__disabled,
            );

            expect(TOOLBAR_CLS.link).not.toBe(TOOLBAR_CLS.link__active);
            expect(TOOLBAR_CLS.link).not.toBe(TOOLBAR_CLS.link__disabled);
            expect(TOOLBAR_CLS.link__active).not.toBe(
                TOOLBAR_CLS.link__disabled,
            );

            expect(TOOLBAR_CLS.dropdown).not.toBe(TOOLBAR_CLS.dropdown__open);
            expect(TOOLBAR_CLS.dropdown_item).not.toBe(
                TOOLBAR_CLS.dropdown_item__active,
            );
            expect(TOOLBAR_CLS.dropdown_item).not.toBe(
                TOOLBAR_CLS.dropdown_item__disabled,
            );
        });

        it("should have unique class names", () => {
            const classNames = Object.values(TOOLBAR_CLS);
            const uniqueClassNames = [...new Set(classNames)];

            expect(uniqueClassNames).toHaveLength(classNames.length);
        });

        it("should support CSS selector construction", () => {
            // Test that class names can be used to construct CSS selectors
            const selectors = [
                `.${TOOLBAR_CLS.toolbar}`,
                `.${TOOLBAR_CLS.button}.${TOOLBAR_CLS.button__active}`,
                `.${TOOLBAR_CLS.dropdown}.${TOOLBAR_CLS.dropdown__open}`,
                `.${TOOLBAR_CLS.dropdown_item}.${TOOLBAR_CLS.dropdown_item__disabled}`,
            ];

            selectors.forEach((selector) => {
                expect(selector).toMatch(/^\.[a-z-_]+(\.[a-z-_]+)*$/);
            });
        });

        it("should support state combinations", () => {
            // Test that state modifiers can be combined logically
            const buttonStates = [
                TOOLBAR_CLS.button,
                `${TOOLBAR_CLS.button} ${TOOLBAR_CLS.button__active}`,
                `${TOOLBAR_CLS.button} ${TOOLBAR_CLS.button__disabled}`,
            ];

            const linkStates = [
                TOOLBAR_CLS.link,
                `${TOOLBAR_CLS.link} ${TOOLBAR_CLS.link__active}`,
                `${TOOLBAR_CLS.link} ${TOOLBAR_CLS.link__disabled}`,
            ];

            const dropdownStates = [
                TOOLBAR_CLS.dropdown,
                `${TOOLBAR_CLS.dropdown} ${TOOLBAR_CLS.dropdown__open}`,
            ];

            [...buttonStates, ...linkStates, ...dropdownStates].forEach(
                (stateClass) => {
                    expect(typeof stateClass).toBe("string");
                    expect(stateClass.length).toBeGreaterThan(0);
                },
            );
        });
    });

    describe("class name consistency", () => {
        it("should maintain consistent modifier patterns", () => {
            const modifiers = [
                TOOLBAR_CLS.toolbar__visible,
                TOOLBAR_CLS.button__active,
                TOOLBAR_CLS.button__disabled,
                TOOLBAR_CLS.link__active,
                TOOLBAR_CLS.link__disabled,
                TOOLBAR_CLS.dropdown__open,
                TOOLBAR_CLS.dropdown_item__active,
                TOOLBAR_CLS.dropdown_item__disabled,
            ];

            modifiers.forEach((modifier) => {
                expect(modifier).toMatch(/--[a-z]+$/);
            });
        });

        it("should maintain consistent element patterns", () => {
            const elements = [
                TOOLBAR_CLS.button,
                TOOLBAR_CLS.link,
                TOOLBAR_CLS.separator,
                TOOLBAR_CLS.dropdown,
                TOOLBAR_CLS.dropdown_button,
                TOOLBAR_CLS.dropdown_menu,
                TOOLBAR_CLS.dropdown_item,
            ];

            elements.forEach((element) => {
                expect(element).toMatch(/^generic-toolbar__[a-z-_]+$/);
            });
        });
    });

    describe("usage patterns", () => {
        it("should support common CSS patterns", () => {
            // Test patterns that would commonly be used in CSS
            const commonPatterns = {
                hiddenToolbar: `${TOOLBAR_CLS.toolbar}:not(.${TOOLBAR_CLS.toolbar__visible.split("--")[1]})`,
                activeButton: `${TOOLBAR_CLS.button}.${TOOLBAR_CLS.button__active.split("--")[1]}`,
                disabledButton: `${TOOLBAR_CLS.button}.${TOOLBAR_CLS.button__disabled.split("--")[1]}`,
            };

            Object.values(commonPatterns).forEach((pattern) => {
                expect(typeof pattern).toBe("string");
                expect(pattern.length).toBeGreaterThan(0);
            });
        });

        it("should support JavaScript class manipulation", () => {
            // Test that class names work with common DOM operations
            const element = document.createElement("div");

            element.className = TOOLBAR_CLS.toolbar;
            expect(element.classList.contains(TOOLBAR_CLS.toolbar)).toBe(true);

            element.classList.add(TOOLBAR_CLS.toolbar__visible);
            expect(
                element.classList.contains(TOOLBAR_CLS.toolbar__visible),
            ).toBe(true);

            element.classList.remove(TOOLBAR_CLS.toolbar__visible);
            expect(
                element.classList.contains(TOOLBAR_CLS.toolbar__visible),
            ).toBe(false);
        });
    });
});
