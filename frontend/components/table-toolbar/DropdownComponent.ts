import {
    ButtonComponent,
    ButtonOrDropdown,
    IToolbarMenuItem,
    TABLE_TOOLBAR_CLS,
} from "@/components/table-toolbar";
import { EditorView } from "prosemirror-view";
import crelt from "crelt";

/**
 * Class to create a toolbar menu inside the table toolbar.
 * A menu can be a dropdown or just a button - this is based on
 * the availability of items inside this.props
 */
export class TableToolbarMenu {
    private readonly props: ButtonOrDropdown;
    private view: EditorView;
    public readonly dom: HTMLElement;
    private button?: ButtonComponent;
    private toolbarMenu?: HTMLElement;
    private toolbarMenuItems?: ToolbarMenuItem[];

    constructor(props: ButtonOrDropdown, view: EditorView) {
        this.props = props;
        this.view = view;
        this.dom = this.createDOM();
    }

    /**
     * Create the toolbar menu and return it as dom element.
     * @private
     */
    private createDOM() {
        this.button = this.createToolbarMenuButton();

        // Just create a button
        if (!this.props.items) return this.button.dom;

        this.toolbarMenuItems = this.createToolbarMenuItems(this.props.items);

        this.toolbarMenu = crelt(
            "div",
            { class: TABLE_TOOLBAR_CLS.dropdown_menu },
            ...this.toolbarMenuItems.map((x) => x.itemDom),
        );

        // Create a dropdown
        return crelt(
            "div",
            {
                class: TABLE_TOOLBAR_CLS.dropdown,
                "data-dropdown": this.props.title,
            },
            this.button.dom,
            this.toolbarMenu,
        );
    }

    /**
     * Create menu button with ButtonComponent class.
     * @param items the items that will be created.
     * @private
     */
    private createToolbarMenuButton() {
        const btn = new ButtonComponent(
            {
                ...this.props,
                icon: this.props.icon,
                title: this.props.title,
                class: this.props.command
                    ? ""
                    : TABLE_TOOLBAR_CLS.dropdown_button,
                command: this.props.command,
            },
            this.view,
        );

        btn.dom.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Close all other dropdowns
            const container = this.dom?.closest(
                "." + TABLE_TOOLBAR_CLS.toolbar,
            );
            if (container) TableToolbarMenu.closeDropdowns(container, this.dom);

            // Toggle this dropdown
            this.dom?.classList.toggle(TABLE_TOOLBAR_CLS.dropdown__open);
        });

        return btn;
    }

    /**
     * Create menu items with ToolbarMenuItem class.
     * @param items the items that will be created.
     * @private
     */
    private createToolbarMenuItems(items: IToolbarMenuItem[]) {
        return items.map(
            (item) => new ToolbarMenuItem(item, this.view, this.dom),
        );
    }

    /**
     * (Re)render the toolbar menu (button and menu items).
     * @param view the new view to render the menu with
     * @public
     */
    public render(view: EditorView) {
        this.view = view;
        this.button?.render(this.view);
        this.toolbarMenuItems?.forEach((item) => item.render(this.view));
    }

    /**
     * Closes all open dropdowns within a container, optionally excluding one
     * @param cntr (container) the container we are checking for dropdowns.
     * @param exc (except) close all dropdowns except this one.
     * @public
     * @static
     */
    public static closeDropdowns(cntr: Element, exc?: HTMLElement) {
        cntr.querySelectorAll("." + TABLE_TOOLBAR_CLS.dropdown__open).forEach(
            (el) => {
                if (el !== exc)
                    el.classList.remove(TABLE_TOOLBAR_CLS.dropdown__open);
            },
        );
    }
}

/**
 * Create a toolbar menu item based on props that satisfies `IToolbarMenuItem`
 * Used to create and re-render the menu item.
 */
export class ToolbarMenuItem {
    private readonly props: IToolbarMenuItem;
    private view: EditorView;
    private readonly dom: HTMLElement;
    public readonly itemDom: HTMLElement;

    constructor(props: IToolbarMenuItem, view: EditorView, dom: HTMLElement) {
        this.props = props;
        this.view = view;
        this.dom = dom;
        this.itemDom = this.createDOM();
    }

    /**
     * Create the toolbar menu item and return it as dom element.
     * @private
     */
    private createDOM() {
        const el = crelt(
            "div",
            { class: TABLE_TOOLBAR_CLS.dropdown_item },
            this.props.title,
        );

        el.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (this.props.command)
                if (this.props.command(this.view.state, this.view.dispatch))
                    this.view.focus();

            // Close dropdown
            this.dom.classList.remove(TABLE_TOOLBAR_CLS.dropdown__open);
        });

        return el;
    }

    /**
     * (Re)render the menu item with the current view
     * @param view the current view we use to update the states.
     * @public
     */
    public render(view: EditorView) {
        this.view = view;
        const { command, isActive } = this.props;
        const isEnabled = command ? command(this.view.state) : true;
        const active = isActive ? isActive(this.view) : false;

        this.itemDom.classList.toggle(
            TABLE_TOOLBAR_CLS.dropdown_item__disabled,
            !isEnabled,
        );
        this.itemDom.classList.toggle(
            TABLE_TOOLBAR_CLS.dropdown_item__active,
            active,
        );
    }
}
