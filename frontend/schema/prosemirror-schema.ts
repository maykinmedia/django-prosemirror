import {
    DOMOutputSpec,
    Mark,
    MarkSpec,
    Node,
    NodeSpec,
    ParseRule,
    Schema,
    SchemaSpec,
    TagParseRule,
} from "prosemirror-model";
import { DjangoProsemirrorSettings } from "@/types/types";
import { SchemaNodesEnum } from "./choices";

const addCls = (obj: Record<string, unknown>, cls?: string) => {
    if (cls) {
        obj.class = cls;
        return obj;
    }
    return Object.keys(obj).length > 0 ? obj : undefined;
};

// type MySchemaNodes = {
//     [K in SchemaNodesEnum]?: NodeSpec;
// };

// type Partial<Record<SchemaNodesEnum, MarkSpec>> = {
//     [K in SchemaNodesEnum]?: MarkSpec;
// };

// Type implementations to deal with the custom toDOM and parseDOM functions.
type CustomNodeSpec = Omit<NodeSpec, "toDOM"> & {
    toDOM?: (node?: Node) => DOMOutputSpec;
    parseDOM?: TagParseRule[];
};
type CustomMarkSpec = Omit<MarkSpec, "toDOM"> & {
    toDOM?: (mark?: Mark, inline?: boolean) => DOMOutputSpec;
    parseDOM?: ParseRule[];
};

class DjangoProsemirrorSchema {
    settings?: DjangoProsemirrorSettings;

    constructor(settings?: DjangoProsemirrorSettings) {
        this.settings = settings;
    }

    /**
     * The top level document node.
     * @required Must be included in every schema
     */
    get doc(): CustomNodeSpec {
        return {
            content: "block+",
        };
    }

    /**
     * The text node.
     * @required Must be included in every schema
     */
    get text(): CustomNodeSpec {
        return {
            group: "inline",
        };
    }

    /**
     * A plain paragraph textblock.
     * @example <p>{ content }</p>
     * @required Must be included in every schema
     */
    get paragraph(): CustomNodeSpec {
        const className = this.settings?.classNames?.paragraph;
        return {
            content: "inline*",
            group: "block",
            parseDOM: [{ tag: "p" }],
            toDOM() {
                const attrs = addCls({}, className);
                return attrs ? ["p", attrs, 0] : ["p", 0];
            },
        };
    }

    /**
     * A blockquote wrapping one or more blocks
     * @example <blockquote>{ content }</blockquote>
     */
    get blockquote(): CustomNodeSpec {
        const className = this.settings?.classNames?.blockquote;
        return {
            content: "block+",
            group: "block",
            defining: true,
            parseDOM: [{ tag: "blockquote" }],
            toDOM() {
                const attrs = addCls({}, className);
                return attrs ? ["blockquote", attrs, 0] : ["blockquote", 0];
            },
        };
    }

    /**
     * A horizontal rule
     * @exmaple <hr/>
     */
    get horizontal_rule(): CustomNodeSpec {
        const className = this.settings?.classNames?.horizontal_rule;
        return {
            group: "block",
            parseDOM: [{ tag: "hr" }],
            toDOM() {
                const attrs = addCls({}, className);
                return attrs ? ["hr", attrs] : ["hr"];
            },
        };
    }

    /**
     * A heading textblock, with a `level` attribute that
     * should hold the number 1 to 6.
     * @example <h1>{ content }</h1>
     */
    get heading(): CustomNodeSpec {
        const className = this.settings?.classNames?.heading;
        return {
            attrs: { level: { default: 1, validate: "number" } },
            content: "inline*",
            group: "block",
            defining: true,
            parseDOM: [
                { tag: "h1", attrs: { level: 1 } },
                { tag: "h2", attrs: { level: 2 } },
                { tag: "h3", attrs: { level: 3 } },
                { tag: "h4", attrs: { level: 4 } },
                { tag: "h5", attrs: { level: 5 } },
                { tag: "h6", attrs: { level: 6 } },
            ],
            toDOM(node) {
                const attrs = addCls(
                    {},
                    className
                        ? `${className}-${node?.attrs?.level}`
                        : undefined,
                );
                return attrs
                    ? ["h" + (node?.attrs?.level ?? 1), attrs, 0]
                    : ["h" + (node?.attrs?.level ?? 1), 0];
            },
        };
    }

    /**
     * A code listing. Disallows marks or non-text inline nodes by default.
     * @example <pre><code>{ content }</code></pre>
     */
    get code_block(): CustomNodeSpec {
        const className = this.settings?.classNames?.code_block;
        const codeClassName = this.settings?.classNames?.code;

        return {
            content: "text*",
            marks: "",
            attrs: {
                spellcheck: false,
            },
            group: "block",
            code: true,
            defining: true,
            parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
            toDOM() {
                const preAttrs = addCls({ spellcheck: false }, className);
                const codeAttrs = addCls({}, codeClassName);
                return [
                    "pre",
                    preAttrs || { spellcheck: false },
                    codeAttrs ? ["code", codeAttrs, 0] : ["code", 0],
                ];
            },
        };
    }

    /**
     * An inline image node. Supports `src`, `alt`, and `title` attributes.
     * `alt` & `title` defaults to the empty string.
     * @example <img src={src} alt={alt} title={title} />
     */
    get image(): CustomNodeSpec {
        const className = this.settings?.classNames?.image;

        return {
            inline: true,
            attrs: {
                src: { validate: "string" },
                alt: { default: "", validate: "string|null" },
                title: { default: null, validate: "string|null" },
            },
            group: "inline",
            draggable: true,
            parseDOM: [
                {
                    tag: "img[src]",
                    getAttrs(dom) {
                        return {
                            src: dom.getAttribute("src"),
                            title: dom.getAttribute("title"),
                            alt: dom.getAttribute("alt"),
                        };
                    },
                },
            ],
            toDOM(node) {
                return [
                    "img",
                    addCls(
                        {
                            src: node?.attrs.src,
                            alt: node?.attrs.alt,
                            title: node?.attrs.title,
                        },
                        className,
                    ),
                ];
            },
        };
    }

    /**
     * A hard line break.
     * @example <br/>
     */
    get hard_break(): CustomNodeSpec {
        return {
            inline: true,
            group: "inline",
            selectable: false,
            parseDOM: [{ tag: "br" }],
            toDOM() {
                return ["br"];
            },
        };
    }

    // List structure nodes //
    /**
     * An ordered list. Has a attribute, `order`,
     * which determines the number at which the list starts counting, and defaults to 1.
     * @example <ol start={start}>{ content }</ol>
     */
    get ordered_list(): CustomNodeSpec {
        const className = this.settings?.classNames?.ordered_list;

        return {
            attrs: { order: { default: 1, validate: "number" } },
            content: "list_item+",
            group: "block",
            parseDOM: [
                {
                    tag: "ol",
                    getAttrs(dom) {
                        return {
                            order: dom.hasAttribute("start")
                                ? +dom.getAttribute("start")!
                                : 1,
                        };
                    },
                },
            ],
            toDOM(node) {
                if (node?.attrs.order == 1) {
                    const attrs = addCls({}, className);
                    return attrs ? ["ol", attrs, 0] : ["ol", 0];
                } else {
                    const attrs = addCls(
                        { start: node?.attrs.order },
                        className,
                    );
                    return ["ol", attrs || { start: node?.attrs.order }, 0];
                }
            },
        };
    }

    /**
     * A bullet/unordered list.
     * @example <ul>{ content }</ul>
     */
    get unordered_list(): CustomNodeSpec {
        const className = this.settings?.classNames?.unordered_list;
        return {
            content: "list_item+",
            group: "block",
            parseDOM: [{ tag: "ul" }],
            toDOM() {
                const attrs = addCls({}, className);
                return attrs ? ["ul", attrs, 0] : ["ul", 0];
            },
        };
    }

    /**
     * A list item.
     * @example <li>{ content }</li>
     */
    get list_item(): CustomNodeSpec {
        const className = this.settings?.classNames?.list_item;
        return {
            content: "paragraph block*",
            parseDOM: [{ tag: "li" }],
            toDOM() {
                const attrs = addCls({}, className);
                return attrs ? ["li", attrs, 0] : ["li", 0];
            },
            defining: true,
        };
    }

    /**
     * A link. Has `href` and optionally `title` attributes.
     * `title` defaults to the empty string.
     * @example <a href={href} title={title}>{ content }</a>
     */
    get link(): CustomMarkSpec {
        const className = this.settings?.classNames?.link;

        return {
            attrs: {
                href: { validate: "string" },
                title: { default: null, validate: "string|null" },
            },
            inclusive: false,
            parseDOM: [
                {
                    tag: "a[href]",
                    getAttrs(dom) {
                        return {
                            href: dom.getAttribute("href"),
                            title: dom.getAttribute("title"),
                        };
                    },
                },
            ],
            toDOM(node) {
                return [
                    "a",
                    addCls(
                        {
                            href: node?.attrs.href,
                            title: node?.attrs.title,
                        },
                        className,
                    ),
                    0,
                ];
            },
        };
    }

    /**
     * An emphasis mark.
     * Has parse rules that also match `<i>` and `font-style: italic`.
     * @example <em>{ content }</em>
     */
    get em(): CustomMarkSpec {
        return {
            parseDOM: [
                { tag: "i" },
                { tag: "em" },
                { style: "font-style=italic" },
                {
                    style: "font-style=normal",
                    clearMark: (m) => m.type.name == "em",
                },
            ],
            toDOM() {
                return ["em", 0];
            },
        };
    }

    /**
     * An underline mark. Rendered as an `<u>` element.
     * @example <u>{ content }</u>
     */
    get underline(): CustomMarkSpec {
        return {
            parseDOM: [{ tag: "u" }, { style: "text-decoration=underline" }],
            toDOM() {
                return ["u", 0];
            },
        };
    }

    /**
     * A strong mark. parse rules also match `<b>` and `font-weight: bold`.
     * @example <strong>{ content }</strong>
     */
    get strong(): CustomMarkSpec {
        return {
            parseDOM: [
                { tag: "strong" },
                // This works around a Google Docs misbehavior where
                // pasted content will be inexplicably wrapped in `<b>`
                // tags with a font-weight normal.
                {
                    tag: "b",
                    getAttrs: (node: HTMLElement) =>
                        node.style.fontWeight != "normal" && null,
                },
                {
                    style: "font-weight=400",
                    clearMark: (m) => m.type.name == "strong",
                },
                {
                    style: "font-weight",
                    getAttrs: (value: string) =>
                        /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
                },
            ],
            toDOM() {
                return ["strong", 0];
            },
        };
    }

    /**
     * Code font mark.
     * @example <code>{ content }</code>
     */
    get code(): CustomMarkSpec {
        const className = this.settings?.classNames?.code;

        return {
            parseDOM: [{ tag: "code" }],
            toDOM() {
                const attrs = addCls({}, className);
                return attrs ? ["code", attrs, 0] : ["code", 0];
            },
        };
    }

    /**
     * A strikethrough mark. Rendered as `<s>` element.
     * @example <s>{ content }</s>
     */
    get strikethrough(): CustomMarkSpec {
        return {
            parseDOM: [
                { tag: "s" },
                { tag: "del" },
                { tag: "strike" },
                { style: "text-decoration=line-through" },
                { style: "text-decoration-line=line-through" },
            ],
            toDOM() {
                return ["s", 0];
            },
        };
    }

    /**
     * These nodes are required in every Prosemirror editor.
     */
    get getRequiredNodes(): Partial<Record<SchemaNodesEnum, NodeSpec>> {
        return {
            doc: this.doc,
            text: this.text,
            paragraph: this.paragraph,
        };
    }

    // Get the specs of all the nodes.
    get getNodeSpecs(): Partial<Record<SchemaNodesEnum, NodeSpec>> {
        return {
            ...this.getRequiredNodes,
            heading: this.heading,
            blockquote: this.blockquote,
            image: this.image,
            ordered_list: this.ordered_list,
            unordered_list: this.unordered_list,
            list_item: this.list_item,
            horizontal_rule: this.horizontal_rule,
            code_block: this.code_block,
            hard_break: this.hard_break,
        };
    }

    get getFilteredNodeSpecs(): Partial<Record<SchemaNodesEnum, NodeSpec>> {
        if (!this.settings?.allowedNodes?.length) return this.getNodeSpecs;
        // Get only the specs of the allowed nodes - start with required nodes.
        return Object.entries(this.getNodeSpecs).reduce(
            (acc, cur) => {
                const [key, value] = cur as [SchemaNodesEnum, NodeSpec];
                const isRequired =
                    key === "doc" || key === "text" || key === "paragraph";
                const isIncluded = this.settings?.allowedNodes.includes(key);
                const isListKey =
                    key === "unordered_list" || key === "ordered_list";

                // Always include required nodes
                if (isRequired) {
                    acc[key] = value;
                }
                // Append list item if either bullet/ordered_list is allowed.
                else if (isIncluded && isListKey) {
                    acc[key] = value;
                    acc["list_item"] = this.list_item;
                } else if (isIncluded) {
                    acc[key] = value;
                }
                return acc;
            },
            {} as Partial<Record<SchemaNodesEnum, NodeSpec>>,
        );
    }

    // Helper method to get all mark specs
    get getMarkSpecs(): Partial<Record<SchemaNodesEnum, MarkSpec>> {
        return {
            link: this.link,
            em: this.em,
            strong: this.strong,
            code: this.code,
            strikethrough: this.strikethrough,
            underline: this.underline,
        };
    }

    get getFilteredMarkSpecs(): Partial<Record<SchemaNodesEnum, MarkSpec>> {
        if (!this.settings?.allowedNodes?.length) return this.getMarkSpecs;
        return Object.entries(this.getMarkSpecs).reduce(
            (acc, cur) => {
                const [key, value] = cur as [SchemaNodesEnum, MarkSpec];
                if (this.settings?.allowedNodes.includes(key)) acc[key] = value;
                return acc;
            },
            {} as Partial<Record<SchemaNodesEnum, MarkSpec>>,
        );
    }

    get schema() {
        return new Schema({
            marks: this.getFilteredMarkSpecs,
            nodes: this.getFilteredNodeSpecs,
        } as SchemaSpec);
    }
}

export default DjangoProsemirrorSchema;
