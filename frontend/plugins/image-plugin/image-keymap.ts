import { keymap } from "prosemirror-keymap";
import { NodeSelection } from "prosemirror-state";
import { Schema } from "prosemirror-model";
import { uploadImage } from "@/plugins/image-upload-plugin";

/**
 * Create keymap for image functionality
 */
export const imageKeymap = (schema: Schema) => {
    const imageNode = schema.nodes.image;
    if (!imageNode) return keymap({});

    return keymap({
        // Ctrl/Cmd + I to insert image (open file picker)
        "Mod-i": (state, dispatch, view) => {
            // Create and trigger file input directly
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";
            fileInput.style.display = "none";

            fileInput.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                const files = target.files;
                if (files && files.length > 0) {
                    const file = files[0];

                    // Upload image and insert into editor
                    uploadImage(file, { src: file }).then((attrs) => {
                        if (view && dispatch) {
                            const node = state.schema.nodes.image.create(attrs);
                            const transaction = state.tr
                                .replaceSelectionWith(node)
                                .scrollIntoView();
                            dispatch(transaction);
                            view.focus();
                        }
                    });
                }
                // Clean up
                document.body.removeChild(fileInput);
            };

            // Add to DOM and trigger click
            document.body.appendChild(fileInput);
            fileInput.click();
            return true;
        },

        // Delete key when image is selected
        Delete: (state, dispatch) => {
            const { selection } = state;
            if (
                selection instanceof NodeSelection &&
                selection.node.type === imageNode
            ) {
                if (dispatch) {
                    dispatch(state.tr.deleteSelection());
                }
                return true;
            }
            return false;
        },

        // Backspace when image is selected
        Backspace: (state, dispatch) => {
            const { selection } = state;
            if (
                selection instanceof NodeSelection &&
                selection.node.type === imageNode
            ) {
                if (dispatch) {
                    dispatch(state.tr.deleteSelection());
                }
                return true;
            }
            return false;
        },
    });
};
