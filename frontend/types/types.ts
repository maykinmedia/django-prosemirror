import { MarkType, NodeType } from "@/schema/types";

export interface IDPMSettings {
    /** Set to false to disable the menu bar. */
    menubar?: boolean;
    /** Set to false to disable the history plugin.*/
    history?: boolean;
    /** Set to false to make the menu bar non-floating. */
    floatingMenu?: boolean;
    language?: LanguageCodeEnum | string;
    debug?: boolean;
    classNames?: Record<string, string>;
    allowedNodes: Array<NodeType>;
    allowedMarks: Array<MarkType>;
    filerUploadEndpoint?: string;
    filerUploadEnabled?: boolean;
}

export enum LanguageCodeEnum {
    NL = "nl",
    EN = "en",
}

export interface IDPMTranslations {
    "Join with above block": string;
    "Lift out of enclosing block": string;
    "Select parent node": string;
    "Undo last change": string;
    "Redo last undone change": string;
    "Insert image": string;
    "Image": string;
    "Location": string;
    "Title": string;
    "Description": string;
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
    "Plain": string;
    "Change to code block": string;
    "Code": string;
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
    "OK": string;
    "Cancel": string;
    "Delete table": string;
    "Add column after": string;
    "Add column before": string;
    "Delete column": string;
    "Toggle header column": string;
    "Merge cells": string;
    "Split cell": string;
    "Add row before": string;
    "Add row after": string;
    "Delete row": string;
    "Toggle header row": string;
    "Insert table": string;
    "Row operations": string;
    "Column operations": string;
    "Cell operations": string;
    "Change image": string;
    "Or": string;
    "Open filer": string;
    "Upload file": string;
    "Current file": string;
    "Current image": string;
    "Change": string;
    "Change image in filer": string;
    "Upload image": string;
    "Edit image": string;
    "Replace image file": string;
    "Caption": string;
    "Change image settings": string;
    "Enter image title": string;
    "Enter image description": string;
    "Enter image caption": string;
}

export type ProseMirrorNode = {
    type: string;
    attrs?: Record<string, unknown>;
    content?: ProseMirrorNode[];
    text?: string;
    marks?: {
        type: string;
        attrs?: Record<string, unknown>;
    }[];
};

export interface ProseMirrorDoc extends ProseMirrorNode {
    type: string; // root must always be "doc"
    content: ProseMirrorNode[];
}
