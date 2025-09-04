import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { render } from "preact";
import crelt from "crelt";
import { signal } from "@preact/signals";
import { IToolbarInstance, CreateMenuItems, IToolbarMenuItem } from "../types";
import { ToolbarComponent } from "./ToolbarComponent";
import { isImageSelected } from "@/utils";
import { ImageDOMAttrs } from "@/schema/nodes/image";
// import { ImageDOMAttrs } from "@/schema/nodes/image";

// type MenuItemGuard<D extends unk = ImageDOMAttrs> = D extends ImageDOMAttrs ? ImageDOMAttrs : D[] | null

/**
 * Preact-first base toolbar instance that uses dynamic components
 * Refactored to mount once and update via signals instead of full re-renders
 */
export class ToolbarInstance<
    T extends Node = Node,
    D extends Record<string, unknown> = ImageDOMAttrs,
> implements IToolbarInstance
{
    public view: EditorView;
    protected target: T;
    protected createMenuItems: CreateMenuItems<T, D>;
    public dom: HTMLElement;
    private clickEvent?: (event: Event) => void;
    public shouldShow: (view: EditorView) => boolean;

    public isVisible = signal(true, { name: "visibility" });
    private menuItems = signal<IToolbarMenuItem<D>[]>([], {
        name: "menuItems",
    });
    private viewSignal = signal<EditorView | null>(null, {
        name: "view",
    });
    private targetSignal = signal<T | null>(null, { name: "target" });

    constructor(
        view: EditorView,
        target: T,
        createMenuItems: CreateMenuItems<T, D>,
        shouldShow: (view: EditorView) => boolean = isImageSelected,
    ) {
        this.view = view;
        this.target = target;
        this.createMenuItems = createMenuItems;
        this.shouldShow = shouldShow;

        // Create and append DOM container
        this.dom = crelt("div");
        crelt(document.body, this.dom);

        this.bindEvents();

        // Mount once
        render(
            <ToolbarComponent
                view={this.viewSignal}
                target={this.targetSignal}
                menuItems={this.menuItems}
                isVisible={this.isVisible}
                onItemClick={this.handleItemClick}
            />,
            this.dom,
        );

        // Initial update
        this.update(view);
    }

    private bindEvents() {
        this.clickEvent = (e: Event) => {
            const target = e.target as Element;

            // Hides toolbar if focus on changes (other node, mark or editor).
            if (!this.dom.contains(target) && !this.view.dom.contains(target)) {
                this.hide();
            } else if (this.shouldShow(this.view)) {
                this.show();
            }
        };

        document.addEventListener("click", this.clickEvent);
    }

    private unbindEvents() {
        if (this.clickEvent) {
            document.removeEventListener("click", this.clickEvent);
        }
    }

    protected handleItemClick = (item: IToolbarMenuItem<D>) => {
        if (item.command) {
            item.command(this.view.state, this.view.dispatch, this.view);
        }
    };

    public show() {
        this.isVisible.value = true;
        this.update(this.view);
    }

    public hide() {
        this.isVisible.value = false;
        this.update(this.view);
    }

    public update(view: EditorView) {
        this.view = view;
        this.viewSignal.value = view;
        this.targetSignal.value = this.target;
        this.menuItems.value = this.createMenuItems(this.view, this.target);
    }

    public destroy() {
        this.dom.remove();
        this.unbindEvents();
    }
}
