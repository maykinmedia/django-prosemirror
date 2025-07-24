import {
    ToolbarRenderer,
    calculateToolbarPosition,
    getTableElementData,
    isInsideTable,
    prefixedClassname,
} from "@/components/table-toolbar";
import crelt from "crelt";
import { EditorView } from "prosemirror-view";

/**
 * Create and append a floating toolbar to the DOM.
 * This toolbar is linked to a view that has tables inside the schema.
 */
export class TableToolbar {
    private renderer: ToolbarRenderer;
    private view: EditorView;
    private isVisible: boolean = false;
    private activeViews: Set<EditorView> = new Set();

    constructor(view: EditorView) {
        this.view = view;
        this.renderer = new ToolbarRenderer(view);

        this.renderer.render(
            () => this.hide(),
            () => this.show(),
            () => this.position(),
            () => this.isInsideTable(),
        );
        this.isVisible = false;

        // Append to document body for absolute positioning
        crelt(document.body, this.renderer.getDom());

        // Track this view
        this.activeViews.add(view);
    }

    private isInsideTable(): boolean {
        // @ts-expect-error prop is available but not in EditorView type.
        if (!this.view.focused) return false;
        return isInsideTable(this.view);
    }

    private position(): void {
        const tableData = getTableElementData(this.view);
        if (!tableData) return;

        const toolbarPosition = calculateToolbarPosition(
            tableData.tableElement,
            this.renderer.getDom(),
        );

        const dom = this.renderer.getDom();
        dom.style.top = `${toolbarPosition.top}px`;
        dom.style.left = `${toolbarPosition.left}px`;
    }

    public show(): void {
        if (!this.isVisible) {
            this.isVisible = true;
            this.renderer
                .getDom()
                .classList.add(prefixedClassname("--visible"));
        }
    }

    public hide(): void {
        if (this.isVisible) {
            this.isVisible = false;
            this.renderer
                .getDom()
                .classList.remove(prefixedClassname("--visible"));
        }
    }

    public update(view: EditorView): void {
        this.view = view;
        const state = view.state;

        // Only show if toolbar is inside a table
        if (this.isInsideTable()) {
            this.show();
            this.position();
            this.renderer.updateStates(state);
        } else {
            this.hide();
        }
    }

    public destroy(): void {
        this.renderer.getDom().remove();
    }
}
