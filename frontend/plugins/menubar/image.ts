import { icons } from "@/plugins/icons";
import { canInsert } from "@/plugins/menubar/utils";
import { uploadImage } from "@/plugins/image-upload-plugin";
import { MenuItem } from "prosemirror-menu";
import { NodeType } from "prosemirror-model";
// import { NodeSelection } from "prosemirror-state";

// TODO this should be a prosemirror config setting.
const BACKEND_UPLOAD_URL = "/prosemirror/filer-upload-handler/";

export function createImageMenuItem(node: NodeType): MenuItem {
    return new MenuItem({
        title: "Insert image",
        label: "Image",
        icon: icons.image,
        enable: (state) => BACKEND_UPLOAD_URL && canInsert(state, node),
        run: (_state, _, view) => {
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
                        const imageNode =
                            view.state.schema.nodes.image.create(attrs);
                        const transaction = view.state.tr
                            .replaceSelectionWith(imageNode)
                            .scrollIntoView();
                        view.dispatch(transaction);
                        view.focus();
                    });
                }
                // Clean up
                document.body.removeChild(fileInput);
            };

            // Add to DOM and trigger click
            document.body.appendChild(fileInput);
            fileInput.click();
        },
    });
}
