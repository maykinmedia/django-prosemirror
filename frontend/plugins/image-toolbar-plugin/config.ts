import { ButtonOrDropdown } from "@/components/table-toolbar";
import { uploadImage } from "@/plugins/image-upload-plugin";
import { translate } from "@/i18n/translations";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

/**
 * Default image toolbar configuration using ButtonOrDropdown format
 */
export const imageToolbarMenuConfig: ButtonOrDropdown[] = [
    {
        icon: "link",
        title: translate("Edit image" as "OK"),
        // This would need to be configured with the actual link URL
        // For now, just return true to indicate the command is available
        command: () => true,
    },
    {
        icon: "image",
        title: translate("Replace image file" as "OK"),
        command: (
            state: EditorState,
            dispatch?: (tr: Transaction) => void,
            view?: EditorView,
        ) => {
            if (!view || !dispatch) return false;

            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";
            fileInput.style.display = "none";

            fileInput.onchange = (e) => {
                const inputTarget = e.target as HTMLInputElement;
                const files = inputTarget.files;
                if (files && files.length > 0) {
                    const file = files[0];

                    uploadImage(file, { src: URL.createObjectURL(file) }).then(
                        (attrs) => {
                            const tr = state.tr.setNodeMarkup(
                                state.selection.from,
                                undefined,
                                attrs,
                            );
                            dispatch(tr);
                            view.focus();
                        },
                    );
                }
                document.body.removeChild(fileInput);
            };

            fileInput.oncancel = () => {
                document.body.removeChild(fileInput);
            };

            document.body.appendChild(fileInput);
            fileInput.click();
            return true;
        },
    },
];
