import "./scss/index.scss";

import { DjangoProsemirror } from "./create";
import { LanguageCodeEnum } from "./types/types.ts";

const initialize = (): void => {
    // Create editors based on the queried fields.
    const EDITORS = document.querySelectorAll<HTMLDivElement>(
        "[data-prosemirror-id]",
    );

    [...EDITORS].forEach((node) => {
        // Start!
        new DjangoProsemirror(node, {
            menubar: true,
            floatingMenu: true,
            language: LanguageCodeEnum.NL, // Get this from the request or doc language.
            debug: true,
            history: node.dataset.prosemirrorHistory == "true",
            allowedNodes: JSON.parse(node.dataset.prosemirrorSchema ?? "[]"),
            classNames: JSON.parse(node.dataset.prosemirrorClasses ?? "{}"),
        });
    });
};

// Start!
ready(initialize);

/**
 * Function wrapper that waits until the document is loaded.
 * @param fn The function that we want to execute on load.
 */
function ready(fn: () => void): void {
    if (document.readyState !== "loading") {
        fn();
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}
