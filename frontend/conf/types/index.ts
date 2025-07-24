/**
 * Type definitions for the schema module.
 *
 * These enums contains the key-value pairs of the available nodes/marks - Each key MUST
 * contain the same value as defined in `django_prosemirror/schema/types.py`
 */

export enum NodeType {
    /** Enumeration of node types that can be used in Prosemirror schemas. */
    // Required nodes (always present)
    DOC = "doc",
    TEXT = "text",
    PARAGRAPH = "paragraph",
    // Optional nodes
    BLOCKQUOTE = "blockquote",
    HORIZONTAL_RULE = "horizontal_rule",
    HEADING = "heading",
    IMAGE = "image",
    HARD_BREAK = "hard_break",
    CODE_BLOCK = "code_block",
    // List nodes
    BULLET_LIST = "bullet_list",
    ORDERED_LIST = "ordered_list",
    LIST_ITEM = "list_item",
    // Table nodes
    TABLE = "table",
    TABLE_ROW = "table_row",
    TABLE_CELL = "table_cell",
    TABLE_HEADER = "table_header",
}

export enum MarkType {
    /** Enumeration of mark types that can be used in Prosemirror schemas. */
    STRONG = "strong",
    ITALIC = "em",
    LINK = "link",
    CODE = "code",
    UNDERLINE = "underline",
    STRIKETHROUGH = "strikethrough",
}

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
}
