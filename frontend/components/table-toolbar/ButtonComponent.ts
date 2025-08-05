import { EditorView } from "prosemirror-view";
import crelt from "crelt";
import { createSVG } from "@/utils/svg";
import { icons } from "@/plugins/icons";
import clsx from "clsx";
import { ButtonOptions, TABLE_TOOLBAR_CLS } from "@/components/table-toolbar";

export class ButtonComponent {
    private readonly props: ButtonOptions;
    public readonly dom: HTMLButtonElement;
    private view: EditorView;

    constructor(props: ButtonOptions, view: EditorView) {
        this.props = props;
        this.view = view;
        this.dom = this.createDOM();
    }

    /**
     * Create the toolbar button and return it as dom element.
     * @private
     */
    private createDOM(): HTMLButtonElement {
        const dom = crelt("button", {
            class: clsx(TABLE_TOOLBAR_CLS.button, this.props.class, {
                [TABLE_TOOLBAR_CLS.button__disabled]: this.props.disabled,
            }),
            type: "button",
            title: this.props.title,
            disabled: this.props.disabled,
        }) as HTMLButtonElement;

        if (this.props.icon && icons[this.props.icon]) {
            const svg = createSVG(icons[this.props.icon]);
            if (svg) crelt(dom, svg);
        }

        if (this.props.command)
            dom.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (this.props.command!(this.view.state, this.view.dispatch)) {
                    this.view.focus();
                }
            });

        return dom;
    }

    /**
     * (Re)render the button with the current view
     * @param view the current view we use to update the states.
     * @public
     */
    public render(view: EditorView): void {
        this.view = view;
        const { command, isActive } = this.props;

        const isEnabled = command ? command(this.view.state) : true;
        const active = isActive ? isActive(this.view) : false;

        this.dom.classList.toggle(
            TABLE_TOOLBAR_CLS.button__disabled,
            !isEnabled,
        );
        this.dom.classList.toggle(TABLE_TOOLBAR_CLS.button__active, active);
        this.dom.disabled = !isEnabled;
    }
}
