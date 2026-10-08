import { EditorView } from "prosemirror-view";
import crelt from "crelt";
import { translate } from "@/i18n/translations";

const prefix = "ProseMirror-upload-alert";

export type UploadFailure = {
    // The file that failed, if the failure is about a file.
    fileName?: string;
    message: string;
};

const findAlert = (view: EditorView) =>
    view.dom.parentElement?.querySelector<HTMLElement>(`:scope > .${prefix}`);

/**
 * Remove the upload alert of this editor, if any.
 */
export const clearUploadAlert = (view: EditorView) => findAlert(view)?.remove();

/**
 * Show an alert above the editor content listing what failed, by default the
 * files that failed to upload. Replaces any alert that is already shown.
 */
export const showUploadAlert = (
    view: EditorView,
    failures: UploadFailure[],
    title: string = translate("Image upload failed"),
) => {
    const parent = view.dom.parentElement;
    if (!parent || failures.length === 0) return;

    clearUploadAlert(view);

    const dismiss = crelt(
        "button",
        {
            "type": "button",
            "class": `${prefix}-dismiss`,
            "aria-label": translate("Dismiss"),
            "title": translate("Dismiss"),
        },
        "×",
    );
    dismiss.addEventListener("click", () => {
        alert.remove();
        view.focus();
    });

    const alert = crelt(
        "div",
        { class: prefix, role: "alert" },
        crelt(
            "div",
            { class: `${prefix}-content` },
            crelt("strong", { class: `${prefix}-title` }, title),
            crelt(
                "ul",
                { class: `${prefix}-list` },
                failures.map(({ fileName, message }) =>
                    crelt("li", fileName ? `${fileName}: ${message}` : message),
                ),
            ),
        ),
        dismiss,
    );

    parent.insertBefore(alert, view.dom);
};
