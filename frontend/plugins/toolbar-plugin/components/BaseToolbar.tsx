import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { render } from "preact";
import crelt from "crelt";
import { ToolbarInstance, MenuItemsConfig } from "../types";
import { DynamicToolbar } from "./DynamicToolbar";
import { ButtonOrDropdown } from "@/components/table-toolbar";

/**
 * Preact-first base toolbar instance that uses dynamic components
 */
export abstract class BaseToolbarInstance<T extends Node = Node>
    implements ToolbarInstance
{
    protected view: EditorView;
    protected target: T;
    protected menuItemsConfig: MenuItemsConfig<T>;
    public dom: HTMLElement;
    protected isVisible: boolean = true;

    constructor(
        view: EditorView,
        target: T,
        menuItemsConfig: MenuItemsConfig<T>,
    ) {
        this.view = view;
        this.target = target;
        this.menuItemsConfig = menuItemsConfig;

        // Create DOM container
        this.dom = crelt("div");
        document.body.appendChild(this.dom);

        // Initial render
        this.render();
    }

    protected abstract get toolbarClassName(): string;

    protected handleItemClick = (item: ButtonOrDropdown) => {
        if (item.command) {
            item.command(this.view.state, this.view.dispatch, this.view);
        }
    };

    public show(): void {
        if (!this.isVisible) {
            this.isVisible = true;
            this.render();
        }
    }

    public hide(): void {
        if (this.isVisible) {
            this.isVisible = false;
            this.render();
        }
    }

    public update(view: EditorView): void {
        this.view = view;
        this.render();
    }

    public render(): void {
        const menuItems = this.menuItemsConfig.createMenuItems(
            this.view,
            this.target,
        );

        render(
            <DynamicToolbar
                view={this.view}
                target={this.target}
                menuItems={menuItems}
                isVisible={this.isVisible}
                className={this.toolbarClassName}
                onItemClick={this.handleItemClick}
            />,
            this.dom,
        );
    }

    public destroy(): void {
        this.dom.remove();
    }
}
