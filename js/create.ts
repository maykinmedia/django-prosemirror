import { EditorView } from "prosemirror-view";
import { getDjangoProsemirrorPlugins } from "./plugins/index.ts";
import DjangoProsemirrorSchema from "./schema/prosemirror-schema.ts";
import { EditorState } from "prosemirror-state";
import { DOMParser, Node, Schema } from "prosemirror-model";
import { DjangoProsemirrorSettings } from "./types/types.ts";
import { translate } from "./i18n/translations.ts";

export class DjangoProsemirror {
    // inputElement: HTMLInputElement;
    editorSchema: Schema;
    settings?: DjangoProsemirrorSettings;
    editor!: EditorView;
    editorElement: HTMLDivElement;

    /**
     * @param inputElement
     * @param settings
     */
    constructor(node: HTMLDivElement, settings?: DjangoProsemirrorSettings) {
        if (settings?.debug) console.log("INITIALIZING PROSE_MIRROR");
        this.editorElement = node;
        this.editorSchema = new DjangoProsemirrorSchema(settings).schema;
        this.settings = settings;
        this.create();
    }

    get editorId() {
        return this.editorElement?.dataset.prosemirrorInputId;
    }

    get inputElement() {
        return document.getElementById(`${this.editorId}`) as HTMLInputElement;
    }

    get initialDoc() {
        try {
            const inputValue = this.inputElement.value.trim();
            if (inputValue) {
                // Parse JSON and create document from it
                const jsonDoc = JSON.parse(inputValue);
                return this.editorSchema.nodeFromJSON(jsonDoc);
            } else {
                // Fall back to parsing DOM content if no JSON
                return DOMParser.fromSchema(this.editorSchema).parse(
                    this.editorElement!,
                );
            }
        } catch (error) {
            if (this.settings?.debug)
                console.warn(
                    "Failed to parse JSON from input, falling back to DOM parsing:",
                    error,
                );
            // Fall back to parsing DOM content
            return DOMParser.fromSchema(this.editorSchema).parse(
                this.editorElement!,
            );
        }
    }

    updateFormInputValue(doc: Node) {
        const json = JSON.stringify(doc.toJSON(), null, 2);
        this.inputElement.value = json;
        if (this.settings?.debug) console.debug("Setting value to", json);
    }

    create() {
        if (!this.editorElement)
            throw new Error(
                "You must specify an element in which to mount prose mirror",
            );

        if (!this.inputElement)
            throw new Error(
                "You must specify an input element to hold the editor state",
            );

        if (this.settings?.debug)
            console.debug(
                "Editor element:",
                this.editorElement,
                "Input element:",
                this.inputElement,
                "Editor schema:",
                this.editorSchema,
            );

        const fn = (doc: Node) => {
            this.updateFormInputValue(doc);
        };

        this.editor = new EditorView(this.editorElement!, {
            state: EditorState.create({
                doc: this.initialDoc,
                plugins: getDjangoProsemirrorPlugins(
                    this.editorSchema,
                    this.settings,
                ),
            }),
            dispatchTransaction(transaction) {
                const newState = (this.state as EditorState).apply(transaction);
                (this as unknown as EditorView).updateState(newState);
                fn(newState.doc);
            },
            // @ts-expect-error TS tells this is a issue, but it works as expected.
            translate,
        });
    }
}
