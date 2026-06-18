import "@/scss/index.scss";

import { DjangoProsemirror } from "./create.ts";

export const initializeIn = (container: Document | Element) => {
    // Exclude editors inside Django admin empty-form templates. Those divs are
    // cloned when a new inline row is added; initialising them on page load
    // would leave stale ProseMirror DOM in the clone and keep the editor
    // connected to the __prefix__ input instead of the real one.
    const editors = container.querySelectorAll<HTMLDivElement>(
        "[data-prosemirror-id]:not(.empty-form [data-prosemirror-id])",
    );

    [...editors].forEach((node) => {
        // Django's inline formset clones the empty-form template and replaces
        // __prefix__ via:
        //   newRow.innerHTML = newRow.innerHTML.replaceAll("__prefix__", index)
        // That only rewrites text inside child HTML. When the empty-form's
        // editor was already initialised, ProseMirror has added inner DOM, and
        // the browser re-serialises the element, causing the data-* attributes
        // of the editor div itself to be skipped. Django replaces the element's
        // own `id` via a separate step, so we derive the correct inputId from
        // it as a fallback.
        // See test_index.spec.ts > initializeIn > derives inputId when __prefix__
        // was not replaced for a concrete example.
        if (node.dataset.prosemirrorInputId?.includes("__prefix__")) {
            const derivedId = node.id.replace(/-editor$/, "");
            node.dataset.prosemirrorId = derivedId;
            node.dataset.prosemirrorInputId = derivedId;
        }

        try {
            new DjangoProsemirror(node);
        } catch (err) {
            console.error(err);
        }
    });
};

/**
 * Initialises all ProseMirror editors on DOMContentLoaded and whenever Django
 * admin inserts a new inline formset row (`formset:added`). Scans the whole
 * document on load; scopes re-scans to the newly added row.
 */
export function djangoProsemirrorInit() {
    if (document.readyState !== "loading") initializeIn(document);
    else
        document.addEventListener("DOMContentLoaded", () =>
            initializeIn(document),
        );

    // Django >= 4 fires a native CustomEvent on the newly inserted row.
    // Scope the scan to that row so we only initialise fresh editors.
    document.addEventListener("formset:added", (event) => {
        if (event.target instanceof Element) initializeIn(event.target);
    });
}

djangoProsemirrorInit();
