import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { IconKeys } from "../icons";
import { ButtonOrDropdown } from "@/components/table-toolbar";

export interface ToolbarConfig {
    id: string;
    shouldShow: (view: EditorView) => boolean;
    getTarget: (view: EditorView) => Node | HTMLElement | null;
    createToolbar: (
        view: EditorView,
        target: Node | HTMLElement,
    ) => ToolbarInstance;
}

export interface ToolbarInstance {
    dom: HTMLElement;
    update: (view: EditorView) => void;
    show: () => void;
    hide: () => void;
    destroy: () => void;
}

/**
 * Base interface for all menu items
 */
export interface BaseMenuItem {
    id: string;
    label: string;
    icon?: IconKeys;
    title?: string;
    enabled?: boolean;
    active?: boolean;
}

/**
 * Button menu item that executes an action when clicked
 */
export interface ButtonMenuItem extends BaseMenuItem {
    type: "button";
    action: (view: EditorView, target?: Node) => void;
}

/**
 * Separator menu item for visual grouping
 */
export interface SeparatorMenuItem extends BaseMenuItem {
    type: "separator";
}

/**
 * Link menu item that opens a URL
 */
export interface LinkMenuItem extends BaseMenuItem {
    type: "link";
    href: string;
    target?: string;
}

/**
 * Dropdown menu item that contains sub-items
 */
export interface DropdownMenuItem extends BaseMenuItem {
    type: "dropdown";
    items: MenuItem[];
}

/**
 * Union type for all menu item types
 */
export type MenuItem =
    | ButtonMenuItem
    | SeparatorMenuItem
    | LinkMenuItem
    | DropdownMenuItem;

/**
 * Configuration for creating menu items
 */
export interface MenuItemsConfig<T> {
    createMenuItems: (view: EditorView, target: T) => ButtonOrDropdown[];
}
