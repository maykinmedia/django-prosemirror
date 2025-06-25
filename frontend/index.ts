import "./scss/index.scss";

import { DjangoProsemirror } from "./create.ts";
import { LanguageCodeEnum } from "./types/types.ts";

const parseJson = (data: string, name: string) => {
    try {
        return JSON.parse(data);
    } catch {
        console.error(`Invalid JSON in ${name}:`, data);
        throw new Error(
            `Can't create DjangoProseMirror: invalid ${name} JSON structure`,
        );
    }
};

const initialize = (): void => {
    // Create editors based on the queried fields.
    const EDITORS = document.querySelectorAll<HTMLDivElement>(
        "[data-prosemirror-id]",
    );

    [...EDITORS].forEach((node) => {
        try {
            new DjangoProsemirror(node, {
                menubar: true,
                floatingMenu: true,
                language:
                    (node.dataset.prosemirrorLanguage as LanguageCodeEnum) ||
                    LanguageCodeEnum.NL,
                debug: true,
                history: node.dataset.prosemirrorHistory === "true",
                allowedNodes: parseJson(
                    node.dataset.prosemirrorSchema ?? "[]",
                    "data-prosemirror-schema",
                ),
                classNames: parseJson(
                    node.dataset.prosemirrorClasses ?? "{}",
                    "data-prosemirror-classes",
                ),
            });
        } catch (err) {
            console.error((err as Error).message);
        }
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
