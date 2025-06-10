import "prosemirror-view/style/prosemirror.css";
import "prosemirror-menu/style/menu.css";
import "prosemirror-example-setup/style/style.css";

import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { addListNodes } from "prosemirror-schema-list";
import { Schema, DOMParser } from "prosemirror-model";
import { exampleSetup } from "prosemirror-example-setup";

function createDjangoProseMirror(editorElement, inputElement) {
    if (!editorElement)
        throw new Error(
            "You must specify an element in which to mount prose mirror",
        );

    if (!inputElement)
        throw new Error(
            "You must specify an input element to hold the editor state",
        );

    function updateFormInputValue(doc) {
        const json = JSON.stringify(doc.toJSON(), null, 2);
        inputElement.value = json;
        console.debug("Setting value to"), json;
    }

    const theSchema = new Schema({
        nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
        marks: schema.spec.marks,
    });

    console.debug(
        "Editor element:",
        editorElement,
        "Input element:",
        inputElement,
    );

    let initialDoc;
    try {
        const inputValue = inputElement.value.trim();
        if (inputValue) {
            // Parse JSON and create document from it
            const jsonDoc = JSON.parse(inputValue);
            initialDoc = theSchema.nodeFromJSON(jsonDoc);
        } else {
            // Fall back to parsing DOM content if no JSON
            initialDoc = DOMParser.fromSchema(theSchema).parse(editorElement);
        }
    } catch (error) {
        console.warn(
            "Failed to parse JSON from input, falling back to DOM parsing:",
            error,
        );
        // Fall back to parsing DOM content
        initialDoc = DOMParser.fromSchema(theSchema).parse(editorElement);
    }

    const view = new EditorView(editorElement, {
        state: EditorState.create({
            doc: initialDoc,
            plugins: exampleSetup({ schema: theSchema }),
        }),
        dispatchTransaction(transaction) {
            const newState = this.state.apply(transaction);
            this.updateState(newState);

            updateFormInputValue(newState.doc);
        },
    });

    return view;
}

// Make objects globally available
window.createDjangoProseMirror = createDjangoProseMirror;
