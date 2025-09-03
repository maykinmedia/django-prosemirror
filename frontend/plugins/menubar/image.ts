import { icons } from "@/plugins/icons";
import { canInsert } from "@/plugins/menubar/utils";
import { MenuItem } from "prosemirror-menu";
import { NodeType } from "prosemirror-model";

export function createImageMenuItem(node: NodeType): MenuItem {
    return new MenuItem({
        title: "Insert image",
        label: "Image",
        icon: icons.image,
        select: (state) => {
            const uploader = state["image-upload-plugin$"]?.uploader;
            // Hide menu item if the image can't be uploaded or inserted.
            return Boolean(canInsert(state, node) && uploader);
        },
        run: (state, _dispatch, view) => {
            const uploader = state["image-upload-plugin$"]?.uploader;

            if (!uploader) {
                console.warn("Image upload functionality not available");
                return false;
            }

            return uploader.uploadImage(view);
        },
    });
}
