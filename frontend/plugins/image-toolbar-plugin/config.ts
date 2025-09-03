import { translate } from "@/i18n/translations";
import { CreateMenuItems } from "@/plugins/toolbar-plugin";
import { ImageDOMAttrs, ImageNodeAttrs } from "@/schema/nodes/image";
import { Node } from "prosemirror-model";

/**
 * Default image toolbar configuration using ButtonOrDropdown format
 * Depends on imageUpload plugin being available via pluginMethods
 */
export const imageToolbarMenuConfig: CreateMenuItems<Node, ImageDOMAttrs> = (
    view,
    target,
) => {
    return [
        {
            icon: "replaceImage",
            title: translate("Replace image file"),
            enabled: (state) => {
                // Check if target has a valid src
                if (!target.attrs.src) {
                    return false;
                }

                const uploader = state["image-upload-plugin$"]?.uploader;
                // Check if required dependencies are available
                if (!uploader) {
                    console.warn(
                        "Replace image command requires imageUpload plugin to be active",
                    );
                    return false;
                }

                return true;
            },
            command: (state, _dispatch, view) => {
                if (!view) return false;
                const uploader = state["image-upload-plugin$"]?.uploader;
                // Check if required dependencies are available
                if (!uploader) {
                    console.warn(
                        "Replace image command requires imageUpload plugin to be active",
                    );
                    return false;
                }

                return uploader.uploadImage(view);
            },
        },
        {
            icon: "changeAlt",
            title: translate("Change image settings"),
            enabled: () => Boolean(target.attrs.src),
            modalFormProps: {
                title: translate("Change image settings"),
                fields: [
                    {
                        name: "id",
                        type: "hidden",
                        label: "",
                    },
                    {
                        name: "title",
                        label: translate("Title"),
                        type: "text",
                        placeholder: translate("Enter image title"),
                    },
                    {
                        name: "alt",
                        label: translate("Description"),
                        type: "text",
                        placeholder: translate("Enter image description"),
                    },
                    {
                        name: "caption",
                        label: translate("Caption"),
                        type: "text",
                        placeholder: translate("Enter image caption"),
                    },
                ],
                initialData: async (state) => {
                    const uploader = state["image-upload-plugin$"]?.uploader;
                    if (!uploader) return target.attrs as ImageDOMAttrs;

                    try {
                        const data = await uploader.getImageAttributes(
                            target.attrs.imageId,
                        );
                        return data
                            ? ({
                                  id: data.id || target.attrs.imageId,
                                  title: data.title || target.attrs.title,
                                  alt: data.description || target.attrs.alt,
                                  caption: data.caption || target.attrs.caption,
                              } as ImageDOMAttrs)
                            : (target.attrs as ImageDOMAttrs);
                    } catch {
                        return target.attrs as ImageDOMAttrs;
                    }
                },
                onSubmit: async (state, data) => {
                    const uploader = state["image-upload-plugin$"]?.uploader;
                    // Check if required dependencies are available
                    if (!uploader) {
                        console.warn(
                            "Image update requires imageUpload plugin to be active",
                        );
                        return;
                    }

                    const fallback = target.attrs as ImageNodeAttrs;

                    // Use the uploader's updateImageAttributes method
                    const patchAttrs: ImageDOMAttrs = {
                        src: fallback.src,
                        id: data.id || fallback.imageId,
                        title: data.title,
                        alt: data.alt,
                        caption: data.caption || fallback.caption,
                    };
                    // The uploader handles the HTTP request and updates the image in the editor
                    await uploader.updateImageAttributes(patchAttrs, view);
                },
            },
        },
    ];
};
