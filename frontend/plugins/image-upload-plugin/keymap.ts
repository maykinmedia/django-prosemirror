import { keymap } from "prosemirror-keymap";
import { UploadImage } from "./upload";
import { isImageSelected } from "@/utils";
import { IDPMSettings } from "@/types/types";

/**
 * Create keymap for image functionality
 */
export const imageKeymapPlugin = (settings: IDPMSettings) => {
    if (!settings.uploadEndpoint) return undefined;
    const uploadImageInstance = new UploadImage(settings.uploadEndpoint);

    return keymap({
        // Ctrl/Cmd + I to replace selected image (open file picker)
        "Mod-i": (_state, _dispatch, view) => {
            // Check if an image is selected
            if (!view || !isImageSelected(view)) return false;

            return uploadImageInstance.uploadImage(view);
        },
    });
};
