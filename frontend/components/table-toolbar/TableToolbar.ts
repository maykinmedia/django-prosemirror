import {
    TableToolbarMenu,
    getTableElement,
    isInsideTable,
    tableToolbarMenuConfig,
    separator,
    TABLE_TOOLBAR_CLS,
} from "@/components/table-toolbar";
import crelt from "crelt";
import { EditorView } from "prosemirror-view";

/**
 * Create and append a table toolbar to the DOM.
 * This toolbar is linked to a view that has tables inside the schema.
 */
export class TableToolbar {
    /**
     * The actual dom that we create with this class.
     * This is automatically appended to `document.body`
     * @private
     * @readonly
     */
    private readonly dom: HTMLElement;
    /** The current editor view used to update the component. */
    private view: EditorView;
    /**
     * The visibility state rendered hidden
     * @default false
     */
    private isVisible: boolean = false;
    /** The menu items */
    private menuItems?: TableToolbarMenu[];
    private boundClickEvent: (event: Event) => void;

    constructor(view: EditorView) {
        this.view = view;
        this.isVisible = false;
        // Create dropdown components
        this.dom = this.createDOM();

        this.boundClickEvent = this.clickEvent.bind(this);
        this.bindEvents();

        // Append the toolbar to the body.
        crelt(document.body, this.dom);
    }

    private createDOM() {
        const dom = crelt("div", { class: TABLE_TOOLBAR_CLS.toolbar });

        this.menuItems = tableToolbarMenuConfig?.map((props, i, arr) => {
            // Create
            const menu = new TableToolbarMenu(props, this.view);
            const isLast = arr.length - 1 == i;

            // Append seperator after item except last item
            crelt(dom, menu.dom, !isLast ? separator.cloneNode() : undefined);

            return menu;
        });

        return dom;
    }

    private bindEvents() {
        // Setup document click handler
        document.addEventListener("click", this.boundClickEvent);
    }

    private unbindEvents() {
        // Setup document click handler
        document.removeEventListener("click", this.boundClickEvent);
    }

    private clickEvent(e: Event) {
        const target = e.target as Node;
        // Close dropdowns when clicking outside
        if (!this.dom.contains(target)) {
            TableToolbarMenu.closeDropdowns(this.dom);
        }

        // Close table dropdown if focus changes to anything different than the current editor or table toolbar.
        if (!this.dom.contains(target) && !this.view.dom.contains(target)) {
            this.hide();
        } else if (isInsideTable(this.view)) {
            this.show();
            this.updatePosition();
        }
    }

    public updatePosition() {
        const tableElement = getTableElement(this.view);
        const tableWrapper = tableElement?.parentElement;
        if (!tableElement || !tableWrapper) return;

        const wrapperRect = tableWrapper.getBoundingClientRect();
        const tableRect = tableElement.getBoundingClientRect();
        const toolbarRect = this.dom.getBoundingClientRect();

        // Position the toolbar 8px below the table, centered horizontally
        const top = tableRect.top - toolbarRect.height - 8;
        const left =
            wrapperRect.left +
            (Math.min(wrapperRect?.width, tableRect.width) -
                toolbarRect.width) /
                2;

        this.dom.style.top = `${top + window.scrollY}px`;
        this.dom.style.left = `${left + window.scrollX}px`;
    }

    public show() {
        if (!this.isVisible) {
            this.isVisible = true;
            this.dom.classList.add(TABLE_TOOLBAR_CLS.toolbar__visible);
        }
    }

    public hide() {
        if (this.isVisible) {
            this.isVisible = false;
            this.dom.classList.remove(TABLE_TOOLBAR_CLS.toolbar__visible);
        }
    }

    public render(view: EditorView) {
        this.view = view;

        // Update menu item states
        this.menuItems?.forEach((item) => item.render(view));

        if (isInsideTable(this.view)) {
            this.show();
            this.updatePosition();
        } else {
            this.hide();
        }
    }

    public destroy(): void {
        this.dom.remove();
        this.unbindEvents();
    }
}
