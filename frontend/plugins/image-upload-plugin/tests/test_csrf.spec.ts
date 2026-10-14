import { getCSRFToken } from "@/plugins/image-upload-plugin/upload";
import { afterEach, describe, expect, it } from "vitest";

const setCookie = (cookie: string) => {
    document.cookie = cookie;
};

describe("getCSRFToken", () => {
    afterEach(() => {
        document.body.innerHTML = "";
        for (const name of ["csrftoken", "xcsrftoken", "other"]) {
            setCookie(`${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        }
    });

    it("returns the token of the page's csrf_token input", () => {
        document.body.innerHTML =
            '<input type="hidden" name="csrfmiddlewaretoken" value="form-token">';
        setCookie("csrftoken=cookie-token");

        expect(getCSRFToken()).toBe("form-token");
    });

    it("falls back to the CSRF cookie", () => {
        setCookie("other=value");
        setCookie("csrftoken=cookie-token");

        expect(getCSRFToken()).toBe("cookie-token");
    });

    it("ignores cookies whose name only ends with csrftoken", () => {
        setCookie("xcsrftoken=other-token");

        expect(getCSRFToken()).toBeUndefined();
    });

    it("returns undefined without a token", () => {
        expect(getCSRFToken()).toBeUndefined();
    });
});
