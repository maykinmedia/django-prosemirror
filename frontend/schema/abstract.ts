import {
    AttributeSpec,
    DOMOutputSpec,
    Mark,
    MarkSpec,
    Node,
    NodeSpec,
    ParseRule,
    TagParseRule,
} from "prosemirror-model";
import { MarkType, NodeType } from "./types";
import { MutableAttrs, TableRole } from "prosemirror-tables";

export class ClassMapping {
    /** Encapsulates CSS class configuration with defaults and fallbacks. */
    classes?: Record<NodeType | MarkType, string>;
    constructor(classMapping?: Record<string, string>) {
        this.classes = classMapping ?? {};
    }
    get(key: NodeType | MarkType, def: string = "") {
        return this.classes?.[key] ?? def;
    }
    apply_to_attrs(attrs: MutableAttrs, key: NodeType | MarkType) {
        const class_name = this.get(key);
        if (class_name) {
            attrs = attrs ? { ...attrs } : {};
            attrs.class = class_name;
            return attrs;
        }
        return attrs || {};
    }
}

export abstract class NodeDefinition implements NodeSpec {
    classMapping: ClassMapping;
    name?: NodeType;

    // Node spec props.
    attrs?: { [name: string]: AttributeSpec };
    code?: boolean;
    content?: string;
    defining?: boolean;
    draggable?: boolean;
    group?: string;
    inline?: boolean;
    marks?: string;
    parseDOM?: TagParseRule[];
    selectable?: boolean;
    isolating?: boolean;
    tableRole?: TableRole;

    constructor(classMapping: ClassMapping) {
        this.classMapping = classMapping;
    }

    abstract toDOM(node: Node): DOMOutputSpec;

    get spec(): NodeSpec {
        return {
            attrs: this.attrs,
            code: this.code,
            content: this.content,
            defining: this.defining,
            draggable: this.draggable,
            group: this.group,
            inline: this.inline,
            marks: this.marks,
            selectable: this.selectable,
            isolating: this.isolating,
            parseDOM: this.parseDOM,
            toDOM: this.toDOM?.bind(this),
            tableRole: this.tableRole,
        };
    }
}

export abstract class MarkDefinition implements MarkSpec {
    classMapping: ClassMapping;
    name?: MarkType;

    // Mark spec props
    attrs?: { [name: string]: AttributeSpec } | undefined = undefined;
    inclusive?: boolean | undefined = undefined;
    parseDOM?: ParseRule[];

    constructor(classMapping: ClassMapping) {
        this.classMapping = classMapping;
    }

    // abstract get parseDOM(): ParseRule[] | undefined;
    abstract toDOM(mark?: Mark, inline?: boolean): DOMOutputSpec;
    get spec(): MarkSpec {
        return {
            parseDOM: this.parseDOM,
            toDOM: this.toDOM.bind(this),
            attrs: this.attrs,
            inclusive: this.inclusive,
        };
    }
}
