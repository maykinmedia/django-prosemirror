import "@/scss/index.scss";

import { DjangoProsemirror } from "./create.ts";

const initialize = () => {
    // Create editors based on the queried fields.
    const EDITORS = document.querySelectorAll<HTMLDivElement>(
        "[data-prosemirror-id]",
    );

    [...EDITORS].forEach((node) => {
        try {
            new DjangoProsemirror(node);
        } catch (err) {
            console.error(err);
        }
    });
};

// Start!
ready(initialize);

/**
 * Function wrapper that waits until the document is loaded.
 * @param fn The function that we want to execute on load.
 */
function ready(fn: VoidFunction) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
}
