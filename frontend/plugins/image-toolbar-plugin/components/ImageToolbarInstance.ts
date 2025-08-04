import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { BaseToolbarInstance, MenuItemsConfig } from "@/plugins/toolbar-plugin";
import { ButtonOrDropdown } from "@/components/table-toolbar";
/**
 * Image-specific toolbar instance using the Preact-first system
 */
export class ImageToolbarInstance extends BaseToolbarInstance<Node> {
    constructor(
        view: EditorView,
        imageNode: Node,
        config?: ButtonOrDropdown[],
    ) {
        const menuItemsConfig: MenuItemsConfig<Node> = {
            // TODO remove esline ignore!
            // eslint-disable-next-line
            createMenuItems: (_view, _target) => {
                return config!;
            },
        };

        super(view, imageNode, menuItemsConfig);
    }

    protected get toolbarClassName(): string {
        return "generic-toolbar";
    }
}
