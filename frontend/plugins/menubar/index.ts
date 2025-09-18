import {
    wrapItem,
    Dropdown,
    joinUpItem,
    liftItem,
    selectParentNodeItem,
    undoItem,
    redoItem,
    MenuItem,
} from "prosemirror-menu";
import { Schema } from "prosemirror-model";
import { icons } from "../icons";
import { buildTableMenuItem } from "./table";
import { canInsert, createBlockTypeMenuItem, cut, markItem } from "./utils";
import { createLinkMenuItem } from "./link";
import { createImageMenuItem } from "./image";
import { createListWrapMenuItem } from "./list";
import { NodeType } from "@/schema/types";
/**
 * Interface defining the structure of menu items that can be built for the ProseMirror editor.
 * Each property represents a specific menu action or dropdown that can be added to the editor toolbar.
 */
export interface MenuItemResult {
    /** Toggle bold/strong text formatting */
    toggleStrong?: MenuItem;
    /** Toggle italic/emphasis text formatting */
    toggleEm?: MenuItem;
    /** Toggle underline text formatting */
    toggleU?: MenuItem;
    /** Toggle strikethrough text formatting */
    toggleStrikethrough?: MenuItem;
    /** Toggle inline code formatting */
    toggleCode?: MenuItem;
    /** Toggle link creation/removal */
    toggleLink?: MenuItem;
    /** Insert image dialog */
    insertImage?: MenuItem;
    /** Insert table dialog */
    insertTable: MenuItem;
    /** Wrap selection in bullet list */
    wrapBulletList?: MenuItem;
    /** Wrap selection in ordered/numbered list */
    wrapOrderedList?: MenuItem;
    /** Lift list item out of current nesting level */
    liftItem: MenuItem;
    /** Join current list item with the one above */
    joinUpItem: MenuItem;
    /** Wrap selection in blockquote */
    wrapBlockQuote?: MenuItem;
    /** Convert block to paragraph */
    makeParagraph?: MenuItem;
    /** Convert block to code block */
    makeCodeBlock?: MenuItem;
    /** Convert block to heading level 1 */
    makeHead1?: MenuItem;
    /** Convert block to heading level 2 */
    makeHead2?: MenuItem;
    /** Convert block to heading level 3 */
    makeHead3?: MenuItem;
    /** Convert block to heading level 4 */
    makeHead4?: MenuItem;
    /** Convert block to heading level 5 */
    makeHead5?: MenuItem;
    /** Convert block to heading level 6 */
    makeHead6?: MenuItem;
    /** Insert horizontal rule/divider */
    insertHorizontalRule?: MenuItem;
    /** Dropdown menu for insert actions */
    insertMenu: Dropdown;
    /** Dropdown menu for text type changes (paragraph, headings, etc.) */
    typeMenu: Dropdown & { type?: string };
    /** Array of menu items for block-level operations */
    blockMenu: MenuItem[][];
    /** Array of menu items for inline formatting operations */
    inlineMenu: MenuItem[][];
    /** Complete menu structure with all items organized */
    fullMenu: MenuItem[][];
}

/**
 * MenuBuilder class responsible for creating and organizing ProseMirror menu items
 * based on the editor's schema and language preferences.
 */
class MenuBuilder {
    /** The ProseMirror schema defining available nodes and marks */
    private schema: Schema;

    /**
     * Initialize the menu builder with schema and language settings.
     * @param schema - ProseMirror schema defining editor capabilities
     */
    constructor(schema: Schema) {
        this.schema = schema;
    }

    /**
     * Build menu items for text marks (bold, italic, underline, etc.).
     * Only creates items for marks that exist in the current schema.
     * @returns Partial MenuItemResult containing mark-related menu items
     */
    private buildMarkMenuItems(): Partial<MenuItemResult> {
        const result: Partial<MenuItemResult> = {};

        // Bold/strong formatting
        if (this.schema.marks.strong) {
            result.toggleStrong = markItem(this.schema.marks.strong, {
                title: "Toggle strong style",
                icon: icons.strong,
            });
        }

        // Italic/emphasis formatting
        if (this.schema.marks.em) {
            result.toggleEm = markItem(this.schema.marks.em, {
                title: "Toggle emphasis",
                icon: icons.em,
            });
        }

        // Underline formatting
        if (this.schema.marks.underline) {
            result.toggleU = markItem(this.schema.marks.underline, {
                title: "Toggle underline",
                icon: icons.underline,
            });
        }

        // Strikethrough formatting
        if (this.schema.marks.strikethrough) {
            result.toggleStrikethrough = markItem(
                this.schema.marks.strikethrough,
                {
                    title: "Toggle strikethrough",
                    icon: icons.strikethrough,
                },
            );
        }

        // Inline code formatting
        if (this.schema.marks.code) {
            result.toggleCode = markItem(this.schema.marks.code, {
                title: "Toggle code font",
                icon: icons.code,
            });
        }

        // Link creation/removal
        if (this.schema.marks.link) {
            result.toggleLink = createLinkMenuItem(this.schema.marks.link);
        }

        return result;
    }

    /**
     * Build menu items for node operations (images, lists, blocks, etc.).
     * Only creates items for node types that exist in the current schema.
     * @returns Partial MenuItemResult containing node-related menu items
     */
    private buildNodeMenuItems(): Partial<MenuItemResult> {
        const result: Partial<MenuItemResult> = {};

        // Image insertion
        if (this.schema.nodes[NodeType.FILER_IMAGE]) {
            result.insertImage = createImageMenuItem(
                this.schema.nodes[NodeType.FILER_IMAGE],
            );
        }

        // Bullet list operations
        if (this.schema.nodes.bullet_list) {
            result.wrapBulletList = createListWrapMenuItem(
                this.schema.nodes.bullet_list,
                {
                    title: "Wrap in bullet list",
                    icon: icons.bulletList,
                },
            );
            // Add lift up and join up if bullet_list is added to the schema.
            result.liftItem = liftItem;
            result.joinUpItem = joinUpItem;
        }

        // Ordered list operations
        if (this.schema.nodes.ordered_list) {
            result.wrapOrderedList = createListWrapMenuItem(
                this.schema.nodes.ordered_list,
                {
                    title: "Wrap in ordered list",
                    icon: icons.orderedList,
                },
            );
            // Add lift up and join up if ordered_list is added to the schema.
            result.liftItem = liftItem;
            result.joinUpItem = joinUpItem;
        }

        // Blockquote wrapping
        if (this.schema.nodes.blockquote) {
            result.wrapBlockQuote = wrapItem(this.schema.nodes.blockquote, {
                title: "Change to block quote",
                icon: icons.blockquote,
            });
            result.liftItem = liftItem;
        }

        // Paragraph block type
        if (this.schema.nodes.paragraph) {
            result.makeParagraph = createBlockTypeMenuItem(
                this.schema.nodes.paragraph,
                {
                    title: "Change to paragraph",
                    label: "Plain",
                },
            );
        }

        // Code block type
        if (this.schema.nodes.code_block) {
            result.makeCodeBlock = createBlockTypeMenuItem(
                this.schema.nodes.code_block,
                {
                    title: "Change to code block",
                    label: "Code",
                },
            );
        }

        // Heading levels 1-6
        if (this.schema.nodes.heading) {
            for (let i = 1; i <= 6; i++) {
                (result as Record<string, MenuItem>)[`makeHead${i}`] =
                    createBlockTypeMenuItem(this.schema.nodes.heading, {
                        title: `Change to heading ${i}`,
                        label: `Level ${i}`,
                        attrs: { level: i },
                    });
            }
        }

        // Horizontal rule insertion
        if (this.schema.nodes.horizontal_rule) {
            result.insertHorizontalRule = createBlockTypeMenuItem(
                this.schema.nodes.horizontal_rule,
                {
                    title: "Insert horizontal rule",
                    label: "Horizontal rule",
                    icon: icons.hr,
                    enable: (state) =>
                        canInsert(state, this.schema.nodes.horizontal_rule),
                    run: (state, dispatch) => {
                        dispatch(
                            state.tr.replaceSelectionWith(
                                this.schema.nodes.horizontal_rule.create(),
                            ),
                        );
                    },
                },
            );
        }

        // Table menu item - only added if all table nodes are present.
        if (
            this.schema.nodes.table &&
            this.schema.nodes.table_cell &&
            this.schema.nodes.table_header &&
            this.schema.nodes.table_row
        ) {
            result.insertTable = buildTableMenuItem();
        }

        return result;
    }

    /**
     * Organize menu items into the final menu structure with dropdowns and groupings.
     * Creates the typeMenu dropdown and organizes items into inline, block, and full menus.
     * @param menuItems - All available menu items
     * @param history - Whether to include undo/redo functionality
     * @returns Complete MenuItemResult with organized menu structure
     */
    private buildMenuStructure(
        menuItems: Partial<MenuItemResult>,
        history: boolean,
    ): MenuItemResult {
        const result = menuItems as MenuItemResult;

        // Create dropdown for text formatting (paragraph, headings, etc.)
        result.typeMenu = new Dropdown(
            cut([
                result.makeParagraph,
                result.makeCodeBlock,
                result.makeHead1,
                result.makeHead2,
                result.makeHead3,
                result.makeHead4,
                result.makeHead5,
                result.makeHead6,
            ]),
            { label: "Type..." },
        );

        // Organize inline formatting menu items
        result.inlineMenu = [
            this.schema.nodes.heading || this.schema.nodes.code_block
                ? (cut([result.typeMenu]) as MenuItem[])
                : [],
            cut([
                result.toggleStrong,
                result.toggleEm,
                result.toggleCode,
                result.toggleU,
                result.toggleStrikethrough,
            ]),
            cut([
                result.toggleLink,
                result.insertImage,
                result.insertHorizontalRule,
            ]),
            cut([result.insertTable]),
        ];

        // Add undo/redo if history is enabled
        const undoMenu = history ? [undoItem, redoItem] : [];

        // Organize block-level menu items
        result.blockMenu = [
            cut([
                result.wrapBulletList,
                result.wrapOrderedList,
                result.wrapBlockQuote,
                result.liftItem,
                result.joinUpItem,
                selectParentNodeItem,
            ]),
        ];

        // Combine all menus into the complete menu structure
        result.fullMenu = result.inlineMenu.concat(result.blockMenu, [
            undoMenu,
        ]);

        this.setupMenuIcons(result, history);

        return result;
    }

    /**
     * Configure icons for built-in ProseMirror menu items.
     * Sets up icons for undo, redo, and structural manipulation items.
     * @param menuItems - Menu items to configure
     * @param history - Whether history (undo/redo) is enabled
     */
    private setupMenuIcons(
        menuItems: Partial<MenuItemResult>,
        history: boolean,
    ): void {
        // Set up undo/redo icons if history is enabled
        if (history) {
            undoItem.spec.icon = icons.undo;
            redoItem.spec.icon = icons.redo;
        }

        // Set up structural navigation icons
        selectParentNodeItem.spec.icon = icons.selectParentNode;

        // Set up list manipulation icons
        if (menuItems.liftItem) {
            menuItems.liftItem.spec.icon = icons.lift;
        }

        if (menuItems.joinUpItem) {
            menuItems.joinUpItem.spec.icon = icons.join;
        }
    }

    /**
     * Build the complete menu structure by combining marks, nodes, and organization.
     * This is the main public method that orchestrates the entire menu building process.
     * @param history - Whether to include undo/redo functionality
     * @returns Complete MenuItemResult with all menu items and structure
     */
    public build(history = false): MenuItemResult {
        const markItems = this.buildMarkMenuItems();
        const nodeItems = this.buildNodeMenuItems();
        const allItems = { ...markItems, ...nodeItems };

        return this.buildMenuStructure(allItems, history);
    }
}

/**
 * Factory function to create a complete set of ProseMirror menu items.
 * This is the main public API for creating editor menus.
 * @param schema - ProseMirror schema defining available nodes and marks
 * @param history - Whether to include undo/redo functionality (default: false)
 * @param language - Language code for internationalization (default: Dutch)
 * @returns Complete MenuItemResult with all menu items organized and ready to use
 */
export function buildMenuItems(schema: Schema, history = true): MenuItemResult {
    const builder = new MenuBuilder(schema);
    return builder.build(history);
}
