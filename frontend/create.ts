import { DPMSchema, DPMSettings, translate } from "@/conf";
import { getDPMPlugins } from "@/plugins/index.ts";
import { DOMParser, Node, Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { fixTables } from "prosemirror-tables";
import { EditorView } from "prosemirror-view";

export class DPMEditor {
    editorElement: HTMLDivElement;
    schema?: Schema;
    settings?: DPMSettings;
    editor?: EditorView;

    /**
     * @param inputElement
     * @param settings
     */
    constructor(node: HTMLDivElement) {
        this.debugLog("%cINIT DPM INSTANCE", "color: blue");

        this.editorElement = node;
        this.create();
    }

    get inputElement() {
        return document.querySelector<HTMLInputElement>(
            `#${this.editorElement?.dataset.prosemirrorInputId}`,
        );
    }

    get initialDoc() {
        if (!this.schema) return;
        try {
            const inputValue = this.inputElement?.value.trim();
            if (inputValue) {
                // Parse JSON and create document from it
                const jsonDoc = JSON.parse(inputValue);
                return this.schema.nodeFromJSON(jsonDoc);
            } else {
                // Fall back to parsing DOM content if no JSON
                return DOMParser.fromSchema(this.schema).parse(
                    this.editorElement!,
                );
            }
        } catch (error) {
            this.warnLog(
                "Failed to parse JSON from input, falling back to DOM parsing:",
                error,
            );
            // Fall back to parsing DOM content
            return DOMParser.fromSchema(this.schema).parse(this.editorElement!);
        }
    }

    updateFormInputValue(doc: Node) {
        const json = JSON.stringify(doc.toJSON(), null, 2);
        if (this.inputElement) this.inputElement.value = json;
        this.debugLog("Setting value to", json);
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

        this.settings = new DPMSettings(this.editorElement);
        this.schema = new DPMSchema(this.settings).schema;

        this.debugLog(
            "Editor element:",
            this.editorElement,
            "Input element:",
            this.inputElement,
            "Editor schema:",
            this.schema,
        );

        const updateFormInputValue = this.updateFormInputValue.bind(this);

        let state = EditorState.create({
            doc: this.initialDoc,
            plugins: getDPMPlugins(this.schema, this.settings),
        });

        // Make sure the history plugin works for the tables.
        const fix = fixTables(state);
        if (fix) state = state.apply(fix.setMeta("addToHistory", false));

        this.editor = new EditorView(this.editorElement, {
            state,
            dispatchTransaction(transaction) {
                const newState = (this.state as EditorState).apply(transaction);
                (this as unknown as EditorView).updateState(newState);
                updateFormInputValue(newState.doc);
            },
            // @ts-expect-error TS tells this is a issue, but it works as expected.
            translate,
        });
    }

    private debugLog(...msg: unknown[]) {
        if (this.settings?.debug) console.debug(...msg);
    }
    private warnLog(...msg: unknown[]) {
        if (this.settings?.debug) console.warn(...msg);
    }
}
