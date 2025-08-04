import { ButtonOrDropdown } from "@/components/table-toolbar";
import {
    getSelectedImageNode,
    isImageSelected,
    ImageToolbarInstance,
} from "@/plugins/image-toolbar-plugin";
import { Plugin, PluginKey } from "prosemirror-state";

// Plugin key for the floating image toolbar
export const imageToolbarKey = new PluginKey("floatingImageToolbar");
/**
 * Plugin to manage the floating image toolbar
 */
export const imageToolbarPlugin = (config?: ButtonOrDropdown[]) => {
    return new Plugin({
        key: imageToolbarKey,
        view() {
            let toolbar: ImageToolbarInstance | null = null;

            return {
                update: (view, prevState) => {
                    const imageSelected = isImageSelected(view);
                    const imageNode = getSelectedImageNode(view);

                    // Only update if the selection has changed
                    if (
                        prevState &&
                        view.state.selection.eq(prevState.selection)
                    ) {
                        return;
                    }

                    // Destroy existing toolbar if it exists
                    if (toolbar) {
                        toolbar.destroy();
                        toolbar = null;
                    }

                    // Create new toolbar if an image is selected
                    if (imageSelected && imageNode) {
                        toolbar = new ImageToolbarInstance(
                            view,
                            imageNode,
                            config,
                        );
                    }
                },
                destroy: () => {
                    if (toolbar) {
                        toolbar.destroy();
                    }
                },
            };
        },
    });
};
