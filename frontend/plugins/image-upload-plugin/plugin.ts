import { Plugin, PluginKey } from "prosemirror-state";
import { UploadImage } from "./upload";
import { IDPMSettings } from "@/types/types";

export interface ImageUploadMethods {
    uploader: UploadImage;
}

export const imageUploadKey = new PluginKey<ImageUploadMethods>(
    "image-upload-plugin",
);

// Extends EditorState with this plugin
declare module "prosemirror-state" {
    interface EditorState {
        "image-upload-plugin$"?: ImageUploadMethods;
    }
}

/**
 * Plugin that handles the uploading of images.
 */
export const uploadPlugin = (settings: IDPMSettings) => {
    if (!settings.uploadEndpoint) return undefined;

    const uploadImageInstance = new UploadImage(settings.uploadEndpoint);

    return new Plugin({
        key: imageUploadKey,
        state: {
            init: () => ({
                uploader: uploadImageInstance,
            }),
            apply: (_tr, pluginState) => pluginState,
        },
        props: {
            handleDOMEvents: {
                drop(view, event) {
                    const files = Array.from(event.dataTransfer?.files || []);
                    const imageFiles = files.filter((file) =>
                        file.type.startsWith("image/"),
                    );

                    if (imageFiles.length > 0) {
                        event.preventDefault();
                        try {
                            uploadImageInstance.uploadAndInsertFiles(
                                imageFiles,
                                view,
                            );
                            return true;
                        } catch (err) {
                            console.error("Could not drop this image: ", err);
                            return false;
                        }
                    }
                    return false;
                },
                paste(view, event) {
                    const files = Array.from(event.clipboardData?.files || []);
                    const imageFiles = files.filter((file) =>
                        file.type.startsWith("image/"),
                    );

                    if (imageFiles.length > 0) {
                        event.preventDefault();
                        try {
                            uploadImageInstance.uploadAndInsertFiles(
                                imageFiles,
                                view,
                            );
                            return true;
                        } catch (err) {
                            console.error("Could not paste this image: ", err);
                            return false;
                        }
                    }
                    return false;
                },
            },
        },
    });
};
