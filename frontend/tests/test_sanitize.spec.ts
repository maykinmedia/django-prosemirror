import { describe, expect, it } from "vitest";
import { isSafeUrl, sanitizeUrl } from "@/utils/sanitize";

const SAFE_URLS = [
    "https://example.com",
    "http://example.com/path?q=1#frag",
    "HTTPS://EXAMPLE.COM",
    "mailto:someone@example.com",
    "tel:+31612345678",
    "//example.com/protocol-relative",
    "/absolute/path",
    "relative/path",
    "example.com",
    "#fragment",
    "?query=1",
    "",
];

const UNSAFE_URLS = [
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "JaVaScRiPt:alert(1)",
    // Browsers strip tabs/newlines from URLs, making these executable.
    "java\nscript:alert(1)",
    "java\tscript:alert(1)",
    "java\r\nscript:alert(1)",
    // Leading whitespace and C0 controls are ignored by browsers.
    "  javascript:alert(1)",
    "\x01javascript:alert(1)",
    "\x00javascript:alert(1)",
    "\tjavascript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "blob:https://example.com/uuid",
    // Not in the allow-list.
    "ftp://example.com/file",
    // Parsed as scheme "example.com" by browsers, not as a host.
    "example.com:8080",
];

const NON_STRING_VALUES: unknown[] = [null, undefined, 123, [], {}];

describe("isSafeUrl", () => {
    it.each(SAFE_URLS)("accepts %j", (url) => {
        expect(isSafeUrl(url)).toBe(true);
    });

    it.each(UNSAFE_URLS)("rejects %j", (url) => {
        expect(isSafeUrl(url)).toBe(false);
    });

    it.each(NON_STRING_VALUES)("rejects non-string %j", (value) => {
        expect(isSafeUrl(value)).toBe(false);
    });
});

describe("sanitizeUrl", () => {
    it.each(SAFE_URLS)("returns safe URLs unchanged (%j)", (url) => {
        expect(sanitizeUrl(url)).toBe(url);
    });

    it.each(UNSAFE_URLS)("replaces unsafe URLs with '#' (%j)", (url) => {
        expect(sanitizeUrl(url)).toBe("#");
    });

    it("uses the provided fallback", () => {
        expect(sanitizeUrl("javascript:alert(1)", "")).toBe("");
    });

    it.each(NON_STRING_VALUES)("replaces non-string %j", (value) => {
        expect(sanitizeUrl(value)).toBe("#");
    });
});
