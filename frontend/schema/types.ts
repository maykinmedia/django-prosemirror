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
