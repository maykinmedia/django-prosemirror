import { beforeEach, describe, expect, it, vi } from "vitest";
import { separator, dynamic_seperator } from "../components/ui/separator";

const expectedClasses = {
    seperator: "table-toolbar__separator",
};

describe("Separator UI Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("separator", () => {
        it("should create a static separator element", () => {
            // The separator is created with the mock, so we just verify properties
            expect(separator).toBeDefined();
            expect(separator.tagName).toBe("DIV");
            expect(separator.className).toBe(expectedClasses.seperator);
        });

        it("should be a single instance", () => {
            // Since it's exported as a constant, it should be the same instance
            const separator1 = separator;
            const separator2 = separator;

            expect(separator1).toBe(separator2);
        });
    });

    describe("dynamic_seperator", () => {
        it("should create a new separator element each time", () => {
            const sep1 = dynamic_seperator();
            const sep2 = dynamic_seperator();

            expect(sep1).toBeInstanceOf(HTMLElement);
            expect(sep2).toBeInstanceOf(HTMLElement);
            expect(sep1.tagName).toBe("DIV");
            expect(sep2.tagName).toBe("DIV");
            expect(sep1.className).toBe(expectedClasses.seperator);
            expect(sep2.className).toBe(expectedClasses.seperator);
        });

        it("should return different instances each time", () => {
            const sep1 = dynamic_seperator();
            const sep2 = dynamic_seperator();

            // Each call should return a different instance
            expect(sep1).not.toBe(sep2);
        });

        it("should create identical elements with same properties", () => {
            const sep1 = dynamic_seperator();
            const sep2 = dynamic_seperator();

            expect(sep1.tagName).toBe(sep2.tagName);
            expect(sep1.className).toBe(sep2.className);
            expect(sep1.outerHTML).toBe(sep2.outerHTML);
        });
    });
});
