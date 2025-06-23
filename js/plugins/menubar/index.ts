import {
    wrapItem,
    Dropdown,
    joinUpItem,
    liftItem,
    selectParentNodeItem,
    undoItem,
    redoItem,
    MenuItem,
    MenuElement,
    MenuItemSpec,
} from "prosemirror-menu";
import { setBlockType } from "prosemirror-commands";
import { NodeSelection, EditorState, Command } from "prosemirror-state";
import { Schema, NodeType, MarkType, Attrs } from "prosemirror-model";
import { toggleMark } from "prosemirror-commands";
import { wrapInList } from "prosemirror-schema-list";
import { TextField, openPrompt } from "./prompt";
import { icons } from "./icons";
import { translate } from "../../i18n/translations";
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
    typeMenu: Dropdown;
    /** Array of menu items for block-level operations */
    blockMenu: MenuElement[][];
    /** Array of menu items for inline formatting operations */
    inlineMenu: MenuElement[][];
    /** Complete menu structure with all items organized */
    fullMenu: MenuElement[][];
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
     * Create an insert image menu item with a dialog for entering image properties.
     * Opens a prompt allowing users to specify image source, title, and alt text.
     * @param node - The image node type from the schema
     * @returns MenuItem for inserting images
     */
    private createImageMenuItem(node: NodeType): MenuItem {
        return new MenuItem({
            title: "Insert image",
            label: "Image",
            icon: icons.image,
            enable: (state) => this.canInsert(state, node),
            run: (state, _, view) => {
                const { from, to } = state.selection;
                let attrs: Attrs | null = null;

                // If an image is already selected, populate the form with its attributes
                if (
                    state.selection instanceof NodeSelection &&
                    state.selection.node.type === node
                ) {
                    attrs = state.selection.node.attrs;
                }

                // Open dialog for image properties
                openPrompt({
                    title: translate("Insert image"),
                    fields: {
                        src: new TextField({
                            label: translate("Location"),
                            required: true,
                            value: attrs?.src,
                        }),
                        title: new TextField({
                            label: translate("Title"),
                            value: attrs?.title,
                        }),
                        alt: new TextField({
                            label: translate("Description"),
                            value:
                                attrs?.alt ||
                                state.doc.textBetween(from, to, " "),
                        }),
                    },
                    dom: view.dom,
                    callback: (attrs) => {
                        // Insert the image with specified attributes
                        view.dispatch(
                            view.state.tr.replaceSelectionWith(
                                node.createAndFill(attrs)!,
                            ),
                        );
                        view.focus();
                    },
                });
            },
        });
    }

    /**
     * Check if a specific node type can be inserted at the current selection position.
     *
     * This function traverses up the document tree from the current selection position
     * to determine if the specified node type can be inserted at any valid location.
     * It's commonly used to enable/disable menu items based on context.
     *
     * @param state - The current editor state containing selection and document
     * @param nodeType - The type of node to test for insertion (e.g., image, table, etc.)
     * @returns True if the node can be inserted at the current position, false otherwise
     */
    private canInsert(state: EditorState, nodeType: NodeType) {
        // Get the resolved position at the start of the current selection
        // $from contains contextual information about the selection's position in the document tree
        const $from = state.selection.$from;

        // Traverse up the document tree from the deepest nesting level to the root
        // depth represents how deeply nested we are (0 = document root)
        for (let d = $from.depth; d >= 0; d--) {
            // Get the index of the current position within the parent node at depth d
            // This tells us where we are within the parent's child list
            const index = $from.index(d);

            // Check if the parent node at this depth can replace content at the current index
            // with the specified node type. We use the same index for start and end (index, index)
            // because we're testing insertion at a point, not replacement of a range
            if ($from.node(d).canReplaceWith(index, index, nodeType))
                return true;
        }

        // If we've traversed the entire tree and found no valid insertion point,
        // the node cannot be inserted at the current selection
        return false;
    }

    /**
     * Check if a specific mark type is active in the current selection.
     * Handles both empty selections (cursor position) and text selections.
     * @param state - Current editor state
     * @param type - Mark type to check for
     * @returns True if the mark is active, false otherwise
     */
    private isMarkActive(state: EditorState, mark: MarkType): boolean {
        const { from, $from, to, empty } = state.selection;
        if (empty) return !!mark.isInSet(state.storedMarks || $from.marks());
        else return state.doc.rangeHasMark(from, to, mark);
    }

    /**
     * Create a menu item for toggling text marks (bold, italic, etc.).
     * Handles the active state detection and provides the toggle functionality.
     * @param markType - The type of mark to toggle
     * @param options - Additional options for the menu item
     * @returns MenuItem for toggling the specified mark
     */
    private markItem(markType: MarkType, options: Partial<MenuItemSpec>) {
        const passedOptions: Partial<MenuItemSpec> = {
            // Check if the mark is currently active in the selection
            active: (state) => {
                return this.isMarkActive(state, markType);
            },
            ...options,
        };
        // Merge all passed options
        for (const prop in options)
            (passedOptions as Record<string, unknown>)[prop] = (
                options as Record<string, unknown>
            )[prop];

        return this.createCommandMenuItem(toggleMark(markType), passedOptions);
    }

    /**
     * Create a generic menu item that executes a ProseMirror command.
     * Handles enable/select state and provides consistent menu item creation.
     * @param cmd - The ProseMirror command to execute
     * @param options - Configuration options for the menu item
     * @returns Configured MenuItem
     */
    private createCommandMenuItem(
        cmd: Command,
        options: Partial<MenuItemSpec>,
    ): MenuItem {
        const passedOptions: MenuItemSpec = {
            label: options.title as string | undefined,
            run: cmd,
            ...options,
        };

        // Set up enable/select logic if not provided
        if (!options.enable && !options.select) {
            passedOptions[options.enable ? "enable" : "select"] = (state) =>
                cmd(state);
        }

        return new MenuItem(passedOptions);
    }

    /**
     * Create a menu item that changes the block type (paragraph, heading, etc.).
     * Sets up the command and enable logic for block type transformations.
     * @param node - The target node type
     * @param options - Configuration options including optional attributes
     * @returns MenuItem for changing block types
     */
    private createBlockTypeMenuItem(
        node: NodeType,
        options: Partial<MenuItemSpec> & { attrs?: Attrs | null },
    ): MenuItem {
        const command = setBlockType(node, options.attrs);
        const passedOptions: MenuItemSpec = {
            run: command,
            enable: (state) => command(state),
            ...options,
        };

        return new MenuItem(passedOptions);
    }

    /**
     * Create a link menu item that can add or remove links from selected text.
     * Opens a dialog for link creation or removes existing links.
     * @param markType - The link mark type from the schema
     * @returns MenuItem for link management
     */
    private createLinkMenuItem(markType: MarkType): MenuItem {
        return new MenuItem({
            title: "Add or remove link",
            icon: icons.link,
            active: (state) => this.isMarkActive(state, markType),
            enable: (state) => !state.selection.empty,
            run: (state, dispatch, view) => {
                // If link is active, remove it
                if (this.isMarkActive(state, markType)) {
                    toggleMark(markType)(state, dispatch);
                    return true;
                }
                // Otherwise, open dialog to create link
                openPrompt({
                    title: translate("Create a link"),
                    fields: {
                        href: new TextField({
                            label: translate("Link target"),
                            required: true,
                        }),
                        title: new TextField({ label: translate("Title") }),
                    },
                    callback: (attrs) => {
                        toggleMark(markType, attrs)(view.state, view.dispatch);
                        view.focus();
                    },
                    dom: view.dom,
                });
                return true;
            },
        });
    }

    /**
     * Create a menu item for wrapping selection in a list (bullet or ordered).
     * Uses the prosemirror-schema-list wrapInList command.
     * @param node - The list node type (bullet_list or ordered_list)
     * @param options - Configuration options for the menu item
     * @returns MenuItem for list wrapping
     */
    private createListWrapMenuItem(
        node: NodeType,
        options: Partial<MenuItemSpec>,
    ): MenuItem {
        return this.createCommandMenuItem(
            wrapInList(
                node,
                (options as Record<string, unknown>).attrs as
                    | Record<string, unknown>
                    | null
                    | undefined,
            ),
            options,
        );
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
            result.toggleStrong = this.markItem(this.schema.marks.strong, {
                title: "Toggle strong style",
                icon: icons.strong,
            });
        }

        // Italic/emphasis formatting
        if (this.schema.marks.em) {
            result.toggleEm = this.markItem(this.schema.marks.em, {
                title: "Toggle emphasis",
                icon: icons.em,
            });
        }

        // Underline formatting
        if (this.schema.marks.underline) {
            result.toggleU = this.markItem(this.schema.marks.underline, {
                title: "Toggle underline",
                icon: icons.underline,
            });
        }

        // Strikethrough formatting
        if (this.schema.marks.strikethrough) {
            result.toggleStrikethrough = this.markItem(
                this.schema.marks.strikethrough,
                {
                    title: "Toggle strikethrough",
                    icon: icons.strikethrough,
                },
            );
        }

        // Inline code formatting
        if (this.schema.marks.code) {
            result.toggleCode = this.markItem(this.schema.marks.code, {
                title: "Toggle code font",
                icon: icons.code,
            });
        }

        // Link creation/removal
        if (this.schema.marks.link) {
            result.toggleLink = this.createLinkMenuItem(this.schema.marks.link);
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
        if (this.schema.nodes.image) {
            result.insertImage = this.createImageMenuItem(
                this.schema.nodes.image,
            );
        }

        // Bullet list operations
        if (this.schema.nodes.bullet_list) {
            result.wrapBulletList = this.createListWrapMenuItem(
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
            result.wrapOrderedList = this.createListWrapMenuItem(
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
            result.makeParagraph = this.createBlockTypeMenuItem(
                this.schema.nodes.paragraph,
                {
                    title: "Change to paragraph",
                    label: "Plain",
                },
            );
        }

        // Code block type
        if (this.schema.nodes.code_block) {
            result.makeCodeBlock = this.createBlockTypeMenuItem(
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
                    this.createBlockTypeMenuItem(this.schema.nodes.heading, {
                        title: `Change to heading ${i}`,
                        label: `Level ${i}`,
                        attrs: { level: i },
                    });
            }
        }

        // Horizontal rule insertion
        if (this.schema.nodes.horizontal_rule) {
            result.insertHorizontalRule = this.createBlockTypeMenuItem(
                this.schema.nodes.horizontal_rule,
                {
                    title: "Insert horizontal rule",
                    label: "Horizontal rule",
                    icon: icons.hr,
                    enable: (state) =>
                        this.canInsert(
                            state,
                            this.schema.nodes.horizontal_rule,
                        ),
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

        return result;
    }

    /**
     * Filter out null and undefined values from an array.
     * Used to clean up menu item arrays before creating dropdowns.
     * @param arr - Array that may contain null/undefined values
     * @returns Array with only truthy values
     */
    private cut<T>(arr: (T | null | undefined)[]): T[] {
        return arr.filter((x): x is T => !!x);
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
            this.cut([
                result.makeParagraph,
                result.makeCodeBlock,
                result.makeHead1,
                result.makeHead2,
                result.makeHead3,
                result.makeHead4,
                result.makeHead5,
                result.makeHead6,
            ]),
            {
                label: "Type...",
                // css: "font-weight: bold",
            },
        );

        // Organize inline formatting menu items
        result.inlineMenu = [
            this.schema.nodes.heading ? this.cut([result.typeMenu]) : [],
            this.cut([
                result.toggleStrong,
                result.toggleEm,
                result.toggleCode,
                result.toggleU,
                result.toggleStrikethrough,
            ]),
            this.cut([
                result.toggleLink,
                result.insertImage,
                result.insertHorizontalRule,
            ]),
        ];

        // Add undo/redo if history is enabled
        const undoMenu = history ? [undoItem, redoItem] : [];

        // Organize block-level menu items
        result.blockMenu = [
            this.cut([
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
