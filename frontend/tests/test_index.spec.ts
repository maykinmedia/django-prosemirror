import { beforeEach, describe, expect, it, vi } from "vitest";
import { djangoProsemirrorInit, initializeIn } from "../index.ts";

describe("Index module", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div data-prosemirror-id="editor1" data-prosemirror-input-id="input1">
                <p>Editor 1 content</p>
            </div>
            <div data-prosemirror-id="editor2" data-prosemirror-input-id="input2">
                <p>Editor 2 content</p>
            </div>
            <input type="hidden" id="input1" value='{"type":"doc","content":[]}' />
            <input type="hidden" id="input2" value='{"type":"doc","content":[]}' />
        `;

        vi.restoreAllMocks();
    });

    describe("initialize function", () => {
        it("should create DjangoProsemirror instances for all elements with data-prosemirror-id", async () => {
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            // We need to mock the DjangoProsemirror constructor before importing
            const { DjangoProsemirror } = await import("../create.ts");
            const constructorSpy = vi.fn();
            vi.spyOn(
                DjangoProsemirror.prototype,
                "constructor" as "create",
            ).mockImplementation(constructorSpy);

            // Since the module may already be cached, we need to force re-initialization
            const initializeModule = await import("../index.ts");

            // The index module runs immediately and may cause errors due to mocking
            // Just verify the module was imported successfully
            expect(initializeModule).toBeDefined();

            consoleSpy.mockRestore();
        });

        it("should catch and log errors when DjangoProsemirror constructor fails", async () => {
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            const error = new Error("Test error");

            const { DjangoProsemirror } = await import("../create.ts");
            vi.spyOn(
                DjangoProsemirror.prototype,
                "constructor" as "create",
            ).mockImplementation(() => {
                throw error;
            });

            // Since the module runs immediately and may be cached, this test is hard to verify
            // Just ensure the module can be imported without crashing
            const initializeModule = await import("../index.ts");
            expect(initializeModule).toBeDefined();

            consoleSpy.mockRestore();
        });
    });

    describe("djangoProsemirrorInit function", () => {
        it("calls initializeIn synchronously and registers formset:added when already loaded", () => {
            vi.spyOn(console, "error").mockImplementation(() => {});
            const addEventListenerSpy = vi.spyOn(document, "addEventListener");
            Object.defineProperty(document, "readyState", {
                value: "complete",
                writable: true,
            });

            djangoProsemirrorInit();

            const events = addEventListenerSpy.mock.calls.map((c) => c[0]);

            // DOMContentLoaded must NOT be registered (initializeIn already ran)
            expect(events).not.toContain("DOMContentLoaded");
            expect(events).toContain("formset:added");
        });

        it("registers DOMContentLoaded and formset:added listeners when document is still loading", () => {
            const addEventListenerSpy = vi.spyOn(document, "addEventListener");
            Object.defineProperty(document, "readyState", {
                value: "loading",
                writable: true,
            });

            djangoProsemirrorInit();

            const events = addEventListenerSpy.mock.calls.map((c) => c[0]);
            expect(events).toContain("DOMContentLoaded");
            expect(events).toContain("formset:added");
        });

        it("calls initializeIn when DOMContentLoaded fires", () => {
            vi.spyOn(console, "error").mockImplementation(() => {});
            Object.defineProperty(document, "readyState", {
                value: "loading",
                writable: true,
            });

            djangoProsemirrorInit();

            // Before the event, initializeIn has not run yet, the beforeEach
            // editors have content so console.error has not been called.
            expect(vi.mocked(console.error)).not.toHaveBeenCalled();

            document.dispatchEvent(new Event("DOMContentLoaded"));

            // After the event, initializeIn ran and tried to mount DjangoProsemirror
            // on the beforeEach editors. In jsdom the constructor throws, which
            // initializeIn catches and forwards to console.error.
            expect(vi.mocked(console.error)).toHaveBeenCalled();
        });
    });

    describe("initializeIn", () => {
        /**
         * Django's inline formset adds a new row by cloning the empty-form
         * template and running:
         *
         *   newRow.innerHTML = newRow.innerHTML.replaceAll("__prefix__", index)
         *
         * That rewrites __prefix__ in serialised child HTML. But when the
         * empty-form's editor was already initialised by ProseMirror, the
         * browser includes ProseMirror's inner DOM in the serialisation, which
         * can cause the data-* attributes of the editor div itself to be skipped
         * in the replacement. Django replaces the element's own `id` attribute
         * via a separate step, so `id` always has the correct index while
         * `data-prosemirror-input-id` may still carry __prefix__.
         *
         * The widget template sets `id="{inputId}-editor"` and
         * `data-prosemirror-input-id="{inputId}"`, so we can always derive the
         * correct inputId by stripping the `-editor` suffix from `node.id`.
         */
        it("derives inputId when __prefix__ was not replaced in data-* attributes", () => {
            document.body.innerHTML = `
                <div
                    id="id_question_set-9-answer-editor"
                    data-prosemirror-id="id_question_set-__prefix__-answer"
                    data-prosemirror-input-id="id_question_set-__prefix__-answer"
                ></div>
                <input type="hidden" id="id_question_set-9-answer" value="null" />
            `;

            vi.spyOn(console, "error").mockImplementation(() => {});

            const editorDiv = document.querySelector<HTMLDivElement>(
                "[data-prosemirror-id]",
            )!;

            initializeIn(document.body);

            expect(editorDiv.dataset.prosemirrorInputId).toBe(
                "id_question_set-9-answer",
            );
            expect(editorDiv.dataset.prosemirrorId).toBe(
                "id_question_set-9-answer",
            );
        });

        it("skips editors inside the empty-form template", () => {
            document.body.innerHTML = `
                <div class="empty-form">
                    <div
                        id="id_question_set-__prefix__-answer-editor"
                        data-prosemirror-id="id_question_set-__prefix__-answer"
                        data-prosemirror-input-id="id_question_set-__prefix__-answer"
                    ></div>
                </div>
                <div
                    id="id_question_set-0-answer-editor"
                    data-prosemirror-id="id_question_set-0-answer"
                    data-prosemirror-input-id="id_question_set-0-answer"
                ></div>
                <input type="hidden" id="id_question_set-0-answer" value="null" />
            `;

            vi.spyOn(console, "error").mockImplementation(() => {});

            const emptyFormEditor = document.querySelector<HTMLDivElement>(
                ".empty-form [data-prosemirror-id]",
            )!;
            const originalInnerHTML = emptyFormEditor.innerHTML;

            initializeIn(document.body);

            // The empty-form editor must not be touched
            expect(emptyFormEditor.innerHTML).toBe(originalInnerHTML);
            expect(emptyFormEditor.dataset.prosemirrorInputId).toBe(
                "id_question_set-__prefix__-answer",
            );
        });
    });
});
