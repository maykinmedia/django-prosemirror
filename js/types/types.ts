import { Schema } from "prosemirror-model";
import { SchemaNodesEnum } from "../schema/choices";

export interface DjangoProsemirrorSettings {
    /** Set to false to disable the menu bar. */
    menubar?: boolean;
    /** Set to false to disable the history plugin.*/
    history?: boolean;
    /** Set to false to make the menu bar non-floating. */
    floatingMenu?: boolean;
    language?: LanguageCodeEnum;
    debug?: boolean;
    classNames?: Partial<Record<SchemaNodesEnum, string>>;
    allowedNodes: string[];
}

export interface DjangoProsemirrorSetup
    extends Omit<DjangoProsemirrorSettings, "language"> {
    /** The model schema of the editor. */
    schema: Schema;
}

export enum LanguageCodeEnum {
    NL = "nl",
    EN = "en",
}

export interface DjangoProsemirrorTranslations {
    "Join with above block": string;
    "Lift out of enclosing block": string;
    "Select parent node": string;
    "Undo last change": string;
    "Redo last undone change": string;
    "Insert image": string;
    Image: string;
    Location: string;
    Title: string;
    Description: string;
    "Add or remove link": string;
    "Create a link": string;
    "Link target": string;
    "Toggle strong style": string;
    "Toggle emphasis": string;
    "Toggle code font": string;
    "Wrap in bullet list": string;
    "Wrap in ordered list": string;
    "Wrap in block quote": string;
    "Change to paragraph": string;
    Plain: string;
    "Change to code block": string;
    Code: string;
    "Change to heading 1": string;
    "Change to heading 2": string;
    "Change to heading 3": string;
    "Change to heading 4": string;
    "Change to heading 5": string;
    "Change to heading 6": string;
    "Level 1": string;
    "Level 2": string;
    "Level 3": string;
    "Level 4": string;
    "Level 5": string;
    "Level 6": string;
    "Insert horizontal rule": string;
    "Type...": string;
    "Toggle underline": string;
    "Toggle strikethrough": string;
    "Horizontal rule": string;
    OK: string;
    Cancel: string;
}
