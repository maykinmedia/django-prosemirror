import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSVG } from "../utils/svg";
import { IconData } from "../plugins/icons";

describe("SVG Utils", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("createSVG", () => {
        it("should return undefined when iconData is not provided", () => {
            const result = createSVG();
            expect(result).toBeUndefined();
        });

        it("should return undefined when iconData is null", () => {
            const result = createSVG(null as unknown as IconData);
            expect(result).toBeUndefined();
        });

        it("should return undefined when iconData is undefined", () => {
            const result = createSVG(undefined);
            expect(result).toBeUndefined();
        });

        it("should create SVG element with correct attributes", () => {
            const iconData: IconData = {
                path: "M10 10 L20 20",
                width: 24,
                height: 24,
            };

            const svg = createSVG(iconData);

            expect(svg).toBeInstanceOf(SVGElement);
            expect(svg?.tagName).toBe("svg");
            expect(svg?.getAttribute("width")).toBe("24");
            expect(svg?.getAttribute("height")).toBe("24");
            expect(svg?.getAttribute("viewBox")).toBe("0 0 24 24");
            expect(svg?.getAttribute("fill")).toBe("currentColor");
        });

        it("should create SVG with path element", () => {
            const iconData: IconData = {
                path: "M10 10 L20 20",
                width: 16,
                height: 16,
            };

            const svg = createSVG(iconData);

            expect(svg?.children.length).toBe(1);
            const path = svg?.children[0];
            expect(path?.tagName).toBe("path");
            expect(path?.getAttribute("d")).toBe("M10 10 L20 20");
        });

        it("should handle different icon sizes", () => {
            const iconData: IconData = {
                path: "M0 0 L32 32",
                width: 32,
                height: 32,
            };

            const svg = createSVG(iconData);

            expect(svg?.getAttribute("width")).toBe("32");
            expect(svg?.getAttribute("height")).toBe("32");
            expect(svg?.getAttribute("viewBox")).toBe("0 0 32 32");
        });

        it("should handle complex path data", () => {
            const iconData: IconData = {
                path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
                width: 24,
                height: 24,
            };

            const svg = createSVG(iconData);
            const path = svg?.children[0];

            expect(path?.getAttribute("d")).toBe(
                "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
            );
        });

        it("should create SVG element with proper namespace", () => {
            const createElementNSSpy = vi.spyOn(document, "createElementNS");
            const iconData: IconData = {
                path: "M10 10 L20 20",
                width: 24,
                height: 24,
            };

            createSVG(iconData);

            expect(createElementNSSpy).toHaveBeenCalledWith(
                "http://www.w3.org/2000/svg",
                "svg",
            );
            expect(createElementNSSpy).toHaveBeenCalledWith(
                "http://www.w3.org/2000/svg",
                "path",
            );

            createElementNSSpy.mockRestore();
        });
    });
});
