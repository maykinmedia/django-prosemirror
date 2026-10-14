import { hasAllowedImageContent } from "@/plugins/image-upload-plugin/upload";
import { describe, expect, it } from "vitest";

// A valid 1x1 PNG, file-type parses more than just the signature.
const PNG = Uint8Array.from(
    atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    ),
    (c) => c.charCodeAt(0),
);
const GIF = new TextEncoder().encode("GIF89a\x01\x00\x01\x00\x00\x00\x00;");

describe("image-upload-plugin/upload hasAllowedImageContent", () => {
    it("should accept files with image content", async () => {
        expect(
            await hasAllowedImageContent(
                new File([PNG], "image.png", { type: "image/png" }),
            ),
        ).toBe(true);
        expect(
            await hasAllowedImageContent(
                new File([GIF], "image.gif", { type: "image/gif" }),
            ),
        ).toBe(true);
    });

    it("should detect the content regardless of name and type", async () => {
        expect(
            await hasAllowedImageContent(
                new File([PNG], "image.txt", { type: "text/plain" }),
            ),
        ).toBe(true);
    });

    it("should reject other content with an image extension", async () => {
        const pdf = new File(["%PDF-1.7\n%âãÏÓ\n"], "fake.png", {
            type: "image/png",
        });
        expect(await hasAllowedImageContent(pdf)).toBe(false);
    });

    it("should reject SVG", async () => {
        const svg = new File(
            ['<svg xmlns="http://www.w3.org/2000/svg"></svg>'],
            "image.png",
            { type: "image/png" },
        );
        expect(await hasAllowedImageContent(svg)).toBe(false);
    });

    it("should reject empty files", async () => {
        expect(
            await hasAllowedImageContent(
                new File([], "empty.png", { type: "image/png" }),
            ),
        ).toBe(false);
    });
});
