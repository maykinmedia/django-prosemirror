import { MarkType, NodeType, IDPMSettings, LanguageCodeEnum } from "@/conf";

// TODO: remove hardcoded value (if these setting becomes relevant).
export class DPMSettings implements IDPMSettings {
    node: HTMLDivElement;
    constructor(node: HTMLDivElement) {
        this.node = node;
    }

    /**
     * Private get setting function that return a parsed value
     * @param key
     * @returns
     */
    private getSetting<T>(key: string, def?: T) {
        try {
            return this.parse(key, this.node.dataset[key]);
        } catch {
            return this.node.dataset[key] || def;
        }
    }

    /**
     * Private parser that handles json parse errors.
     * @param key The dataset key we are trying to parse.
     * @param value The value we are trying to parse
     * @returns
     */
    private parse(key: string, value?: string) {
        try {
            if (!value) return;
            return JSON.parse(value);
        } catch {
            throw new Error(`Failed to parse setting: ${key}: ${value}`);
        }
    }

    /**
     * Setting that defines the allowed nodes
     * @default []
     * @example ["paragraph", "heading"]
     */
    get allowedNodes(): Array<NodeType> {
        return this.getSetting("prosemirrorAllowedNodeTypes", []);
    }

    /**
     * Setting that defines the allowed marks
     * @default []
     * @example ["strong", "em"]
     */
    get allowedMarks(): Array<MarkType> {
        return this.getSetting("prosemirrorAllowedMarkTypes", []);
    }

    /**
     * Object of a node/mark (key) with a class name (value).
     * @default []
     * @example { paragraph: "p-class", heading: "heading-class" }
     */
    get classNames(): Partial<Record<MarkType | NodeType, string>> {
        return this.getSetting("prosemirrorClasses", {});
    }

    /**
     * The id of the editor
     * @default undefined
     */
    get id(): string | undefined {
        return this.node.id ?? undefined;
    }

    /**
     * The id of the input element.
     * @default undefined
     */
    get inputId(): string | undefined {
        return this.getSetting("prosemirrorInputId", undefined);
    }

    /**
     * Setting that defines the the editor uses the history plugin.
     * If true also the buttons are rendered.
     * @default true
     */
    get history(): boolean {
        return this.getSetting("prosemirrorHistory", "true") === true;
    }

    /**
     * Setting that defines the language of the editor, used for translations.
     * This value is read from the html lang attribute.
     * @default 'en'
     */
    get language(): string {
        return document?.documentElement?.lang || LanguageCodeEnum.EN;
    }

    /**
     * Setting that defines the position of the menubar
     * @default true
     */
    get floatingMenu(): boolean {
        return true;
    }

    /**
     * Setting that defines if there is a menubar
     * @default true
     */
    get menubar(): boolean {
        return true;
    }

    /**
     * Setting that defines if the editor is in debug mode.
     * @default true
     */
    get debug(): boolean {
        return true;
    }
}
