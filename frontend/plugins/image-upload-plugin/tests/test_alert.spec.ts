import {
    clearUploadAlert,
    showUploadAlert,
} from "@/plugins/image-upload-plugin/alert";
import { EditorView } from "prosemirror-view";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("image-upload-plugin/alert", () => {
    let parent: HTMLDivElement;
    let view: EditorView;

    beforeEach(() => {
        parent = document.createElement("div");
        const dom = parent.appendChild(document.createElement("div"));
        view = { dom, focus: vi.fn() } as unknown as EditorView;
    });

    const getAlert = () =>
        parent.querySelector<HTMLElement>(".ProseMirror-upload-alert");

    it("should render the failures above the editor content", () => {
        showUploadAlert(view, [
            { fileName: "a.svg", message: "Upload a valid image." },
            { fileName: "b.pdf", message: "Not allowed." },
        ]);

        const alert = getAlert()!;
        expect(alert.getAttribute("role")).toBe("alert");
        expect(alert.nextElementSibling).toBe(view.dom);
        expect(
            Array.from(alert.querySelectorAll("li")).map(
                (li) => li.textContent,
            ),
        ).toEqual(["a.svg: Upload a valid image.", "b.pdf: Not allowed."]);
    });

    it("should render a custom title", () => {
        showUploadAlert(
            view,
            [{ message: "Permission denied" }],
            "Saving image details failed",
        );

        const alert = getAlert()!;
        expect(
            alert.querySelector(".ProseMirror-upload-alert-title")!.textContent,
        ).toBe("Saving image details failed");
        expect(alert.querySelector("li")!.textContent).toBe(
            "Permission denied",
        );
    });

    it("should not render text as HTML", () => {
        showUploadAlert(view, [
            {
                fileName: "<img src=x onerror=alert(1)>.png",
                message: "<b>x</b>",
            },
        ]);

        expect(getAlert()!.querySelector("img, b")).toBeNull();
    });

    it("should replace an existing alert", () => {
        showUploadAlert(view, [{ fileName: "a.png", message: "first" }]);
        showUploadAlert(view, [{ fileName: "b.png", message: "second" }]);

        const alerts = parent.querySelectorAll(".ProseMirror-upload-alert");
        expect(alerts).toHaveLength(1);
        expect(alerts[0].textContent).toContain("second");
    });

    it("should not render without failures", () => {
        showUploadAlert(view, []);
        expect(getAlert()).toBeNull();
    });

    it("should be dismissable", () => {
        showUploadAlert(view, [{ fileName: "a.png", message: "error" }]);
        getAlert()!
            .querySelector<HTMLButtonElement>(
                ".ProseMirror-upload-alert-dismiss",
            )!
            .click();

        expect(getAlert()).toBeNull();
        expect(view.focus).toHaveBeenCalled();
    });

    it("should be cleared", () => {
        showUploadAlert(view, [{ fileName: "a.png", message: "error" }]);
        clearUploadAlert(view);
        expect(getAlert()).toBeNull();
    });
});
