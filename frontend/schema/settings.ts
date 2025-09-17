import { IDPMSettings, LanguageCodeEnum } from "@/types/types";
import { MarkType, NodeType } from "./types";

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
     * Setting that defines if the filer upload is enabled. If this is not
     * true @type {NodeType.FILER_IMAGE} can't be used as node.
     * @default false
     */
    get filerUploadEnabled(): boolean | undefined {
        const setting = this.getSetting(
            "prosemirrorFilerUploadEnabled",
            "false",
        );
        if (setting === "True" || setting === "true") return true;
        return false;
    }
    /**
     * Setting that defines the filer upload endpoint. If this is
     * endpoint is not defined @type {NodeType.FILER_IMAGE} can't
     * be used as node.
     * @default undefined
     */
    get filerUploadEndpoint(): string | undefined {
        const setting = this.getSetting(
            "prosemirrorFilerUploadEndpoint",
            "undefined",
        );
        if (setting === "None") return undefined;
        return setting;
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
     * TODO: remove hardcoded value (if this setting becomes relevant).
     */
    get floatingMenu(): boolean {
        return true;
    }

    /**
     * Setting that defines if there is a menubar
     * @default true
     * TODO: remove hardcoded value (if this setting becomes relevant).
     */
    get menubar(): boolean {
        return true;
    }

    /**
     * Setting that defines if the editor is in debug mode.
     * @default true
     * TODO: remove hardcoded value (if this setting becomes relevant).
     */
    get debug(): boolean {
        return false;
    }
}
