import { Attrs } from "prosemirror-model";
import { translate } from "@/i18n/translations";
import crelt from "crelt";

const prefix = "prompt";

// TODO Convert to react?
export function openPrompt(options: {
    title: string;
    fields: { [name: string]: Field };
    callback: (attrs: Attrs) => void;
    dom: HTMLElement;
    hideButtons?: boolean;
}) {
    if (!options.dom.previousElementSibling) return;

    const wrapper = options.dom.previousElementSibling?.appendChild(
        document.createElement("div"),
    );
    wrapper.className = prefix;

    const mouseOutside = (e: MouseEvent) => {
        if (!wrapper.contains(e.target as HTMLElement)) close();
    };
    setTimeout(() => window.addEventListener("mousedown", mouseOutside), 50);
    const close = () => {
        window.removeEventListener("mousedown", mouseOutside);
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    };

    const domFields: HTMLElement[] = [];
    for (const name in options.fields)
        domFields.push(options.fields[name].render());

    // ugh.
    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = prefix + "-submit";
    submitButton.textContent = translate("OK");
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = prefix + "-cancel";
    cancelButton.textContent = translate("Cancel");
    cancelButton.addEventListener("click", close);

    const form = wrapper.appendChild(document.createElement("form"));
    if (options.title) {
        const title = document.createElement("h4");
        title.textContent = options.title;
        title.className = "utrecht-heading-4";
        form.appendChild(title);
    }
    domFields.forEach((field) => {
        form.appendChild(document.createElement("div")).appendChild(field);
    });

    if (!options.hideButtons) {
        const buttons = form.appendChild(document.createElement("div"));
        buttons.className = prefix + "-buttons";
        buttons.appendChild(submitButton);
        buttons.appendChild(document.createTextNode(" "));
        buttons.appendChild(cancelButton);
    }

    // Position the wrapper
    wrapper.getBoundingClientRect();
    wrapper.style.top = "calc(100% + 12px)";
    wrapper.style.left = "12px";

    const submit = () => {
        const params = getValues(options.fields, domFields);
        if (params) {
            close();
            options.callback(params);
        }
    };

    // Submit handler
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        submit();
    });

    // Keyboard handlers.
    form.addEventListener("keydown", (e) => {
        if (e.keyCode == 27) {
            e.preventDefault();
            close();
        } else if (e.keyCode == 13 && !(e.ctrlKey || e.metaKey || e.shiftKey)) {
            e.preventDefault();
            submit();
        } else if (e.keyCode == 9) {
            window.setTimeout(() => {
                if (!wrapper.contains(document.activeElement)) close();
            });
        }
    });

    const input = form.elements[0] as HTMLElement;
    if (input) input.focus();
}

function getValues(
    fields: { [name: string]: Field },
    domFields: readonly HTMLElement[],
) {
    const result = Object.create(null);
    let i = 0;
    for (const name in fields) {
        const field = fields[name],
            dom = domFields[i++];
        const value = field.read(dom),
            bad = field.validate(value);
        if (bad) {
            reportInvalid(dom, bad);
            return null;
        }
        result[name] = field.clean(value);
    }
    return result;
}

function reportInvalid(dom: HTMLElement, message: string) {
    // FIXME this is awful and needs a lot more work
    const parent = dom.parentNode!;
    if (
        !Array.from(parent.children).find(
            (x) => (x as HTMLElement).className == `${prefix}-invalid`,
        )
    ) {
        const msg = parent.appendChild(document.createElement("div"));
        msg.className = `${prefix}-invalid`;
        msg.textContent = message;
        setTimeout(() => parent.removeChild(msg), 4000);
    }
}

/// The type of field that `openPrompt` expects to be passed to it.
export abstract class Field {
    /// Create a field with the given options. Options support by all
    /// field types are:
    constructor(
        /// @internal
        readonly options: {
            /// The starting value for the field.
            value?: unknown;

            /// The label for the field.
            label: string;

            /// Whether the field is required.
            required?: boolean;

            /// Whether the field is required.
            id?: string;

            /// A function to validate the given value. Should return an
            /// error message if it is not valid.
            validate?: (value: unknown) => string | null;

            /// A cleanup function for field values.
            clean?: (value: unknown) => unknown;

            options?: { value: string; label: string }[];
        },
    ) {}

    /// Render the field to the DOM. Should be implemented by all subclasses.
    abstract render(): HTMLElement;

    /// Read the field's value from its DOM node.
    read(dom: HTMLElement) {
        return (
            (dom as HTMLInputElement).value ?? dom.querySelector("input")?.value
        );
    }

    /// A field-type-specific validation function.
    validateType(): string | null {
        return null;
    }

    /// @internal
    validate(value: unknown): string | null {
        if (!value && this.options.required) return "Dit veld is verplicht";
        return (
            this.validateType() ||
            (this.options.validate ? this.options.validate(value) : null)
        );
    }

    clean(value: unknown): unknown {
        return this.options.clean ? this.options.clean(value) : value;
    }
}

/// A field class for single-line text fields.
export class TextField extends Field {
    render() {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = this.options.label;
        input.value = String(this.options.value || "");
        input.autocomplete = "off";
        input.id = this.options.id ?? "";
        return input;
    }
}

/// A field class for dropdown fields based on a plain `<select>`
/// tag. Expects an option `options`, which should be an array of
/// `{value: string, label: string}` objects, or a function taking a
/// `ProseMirror` instance and returning such an array.
export class SelectField extends Field {
    render() {
        const select = document.createElement("select");
        select.id = this.options.id ?? "";
        const selectOptions = (
            this.options as unknown as {
                options: { value: string; label: string }[];
            }
        ).options;
        selectOptions.forEach((o) => {
            const opt = select.appendChild(document.createElement("option"));
            opt.value = o.value;
            opt.selected = o.value == this.options.value;
            opt.label = o.label;
        });
        return select;
    }
}

export class FileField extends Field {
    render() {
        const input = document.createElement("input");
        input.type = "file";
        input.placeholder = this.options.label;
        input.value = String(this.options.value || "");
        input.autocomplete = "off";
        input.id = this.options.id ?? "";
        return input;
    }
}
export class TableField extends Field {
    rows: number;
    cols: number;
    cells: Array<Array<HTMLButtonElement>>;
    prefix = "table_field";

    constructor(opts: Field["options"]) {
        super(opts);
        this.rows = 8;
        this.cols = 8;
        this.cells = [[]];
    }

    render() {
        const container = crelt("div", {
            class: this.prefix,
        });
        const input = crelt("input", {
            type: "hidden",
            value: "[1,1]",
            id: this.options.id,
        }) as HTMLInputElement;

        // Append element
        crelt(container, input);

        // Store cells in a 2D array for easier column access
        for (let row = 0; row < this.rows; row++) {
            this.cells[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const cell = crelt("button", {
                    class: `${this.prefix}__cell`,
                    type: "submit",
                }) as HTMLButtonElement;

                cell.dataset.pos = `[${row}, ${col}]`;

                // Click handler
                cell.addEventListener("click", () => {
                    input.value = cell.dataset.pos ?? "[1,1]";
                });

                // Mouse enter handler for area highlighting
                cell.addEventListener(
                    "mouseenter",
                    this.highlightArea.bind(this, row, col, true),
                );

                // Mouse leave handler to remove area highlighting
                cell.addEventListener(
                    "mouseleave",
                    this.highlightArea.bind(this, row, col, false),
                );

                this.cells[row][col] = cell;

                // Append element
                crelt(container, cell);
            }
        }

        return container;
    }

    // Function to highlight/unhighlight area from [0,0] to hovered cell
    highlightArea(maxRow: number, maxCol: number, highlight: boolean) {
        for (let row = 0; row <= maxRow; row++) {
            for (let col = 0; col <= maxCol; col++) {
                // Highlight/unhighlight cell
                this.cells[row][col]?.classList.toggle("highlight", highlight);
            }
        }
    }
}
