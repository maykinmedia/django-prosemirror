import { uploadPlugin } from "./plugin";
import { imageKeymapPlugin } from "./keymap";
import { IDPMSettings } from "@/types/types";

/**
 * ## Image Upload Plugin
 *
 * This plugin provides image upload functionality through the EditorView's pluginMethods namespace.
 *
 * Key features:
 * - PluginKey name: 'image-upload-plugin$'
 * - Methods available at: state[image-upload-plugin$].uploader
 * - Automatic drag & drop and paste support for images
 * - Mod-i key binding to replace an image.
 */
export const imageUploadPlugin = (
    settings: IDPMSettings,
    imageInSchema: boolean = false,
) => {
    if (!settings?.uploadEndpoint || !imageInSchema) return [];

    return [uploadPlugin(settings), imageKeymapPlugin(settings)];
};
