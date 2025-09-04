import { EditorView } from "prosemirror-view";
import { IconKeys } from "../icons";
import { Command, EditorState, Transaction } from "prosemirror-state";
import { ToolbarInstance } from "./components";
import { Node } from "prosemirror-model";
import { ImageDOMAttrs } from "@/schema/nodes/image";
import { Signal } from "@preact/signals";

/**
 * Methods for creating and managing toolbar instances.
 */
export interface ToolbarMethods {
    createToolbar: <
        T extends Node = Node,
        D extends Record<string, unknown> = ImageDOMAttrs,
    >(
        view: EditorView,
        target: T,
        createMenuItems: CreateMenuItems<T, D>,
        shouldShow?: (view: EditorView) => boolean,
    ) => ToolbarInstance<T, D>;
}

/**
 * Interface for toolbar instance with DOM element and lifecycle methods.
 */
export interface IToolbarInstance {
    /** The DOM element representing the toolbar */
    dom: HTMLElement;
    /** Update the toolbar based on editor view changes */
    update: (view: EditorView) => void;
    /** Show the toolbar */
    show: () => void;
    /** Hide the toolbar */
    hide: () => void;
    /** Destroy the toolbar and clean up resources */
    destroy: () => void;
}

/**
 * Function to create toolbar menu items.
 */
export type CreateMenuItems<
    T,
    D extends Record<string, unknown> = ImageDOMAttrs,
> = (view?: EditorView, target?: T) => IToolbarMenuItem<D>[];

/**
 * Configuration for a toolbar menu item.
 */
export interface IToolbarMenuItem<
    D extends Record<string, unknown> = ImageDOMAttrs,
> {
    /** Display title for the menu item */
    title?: string;
    /** CSS class to apply to the menu item */
    class?: string;
    /** Icon key to display */
    icon?: IconKeys;
    /** Whether the item is disabled */
    disabled?: boolean;
    /** ProseMirror command to execute when clicked */
    command?: Command;
    /** Function to determine if the item should appear active */
    isActive?: (view: EditorView) => boolean;
    /** Command to determine if the item is enabled */
    enabled?: Command;
    /** Sub-menu items for dropdown functionality */
    items?: IToolbarSubMenuItem[];
    /** Whether to show the title text alongside the icon */
    visibleTitle?: boolean;
    /** Props for modal form if this item opens a modal */
    modalFormProps?: IToolbarModalFormFormProps<D>;
}

/**
 * Configuration for sub-menu items in dropdown menus.
 */
export interface IToolbarSubMenuItem {
    /** Icon key to display */
    icon?: IconKeys;
    /** Display title for the sub-menu item */
    title: string;
    /** ProseMirror command to execute when clicked */
    command: Command;
    /** Custom run function for advanced command execution */
    run?: (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;
    /** Function to determine if the item should appear active */
    isActive?: (view: EditorView) => boolean;
    /** Command to determine if the item is enabled */
    enabled?: Command;
}

/**
 * Position coordinates for toolbar placement.
 */
export interface IToolbarPosition {
    /** Top position in pixels */
    top: number;
    /** Left position in pixels */
    left: number;
}

/**
 * Props for the main toolbar component.
 */
export interface IToolbarProps<
    D extends Record<string, unknown> = ImageDOMAttrs,
> {
    /** ProseMirror editor view */
    /** Target element (Node or HTML element) for positioning */
    view: Signal<EditorView | null>;
    target: Signal<Node | HTMLElement | null>;
    /** Array of menu items to display in the toolbar */
    menuItems: Signal<IToolbarMenuItem<D>[] | null>;
    /** Whether the toolbar should be visible */
    isVisible: Signal<boolean | null>;
    /** Callback when a menu item is clicked */
    onItemClick: (item: IToolbarMenuItem<D>) => void;
    /** Optional callback when a modal is opened */
    onModalOpen?: (triggerRef: React.RefObject<HTMLElement>) => void;
}

/**
 * Props for the toolbar dropdown component.
 */
export interface IToolbarDropdownProps<
    D extends Record<string, unknown> = ImageDOMAttrs,
> {
    /** Menu item containing dropdown configuration */
    item: IToolbarMenuItem<D>;
    /** ProseMirror editor view */
    view: EditorView;
    /** Callback when a dropdown item is clicked */
    onItemClick: (item: IToolbarMenuItem<D>) => void;
}

/**
 * Configuration for form fields in modal forms.
 */
export interface IFormFieldConfig<
    D extends Record<string, unknown> = ImageDOMAttrs,
> {
    /** Name of the field, must match a key in InitialImageData */
    readonly name: Extract<keyof D, string>;
    /** Display label for the field */
    readonly label: string;
    /** Input type for the field */
    readonly type?: "text" | "hidden" | "email" | "url" | "textarea";
    /** Whether the field is required */
    readonly required?: boolean;
    /** Placeholder text for the field */
    readonly placeholder?: string;
}

export interface IToolbarModalFormFieldProps<
    D extends Record<string, unknown> = ImageDOMAttrs,
> extends IFormFieldConfig<D> {
    value: string;
    onChange: (value: string) => void;
}

/**
 * Props for configuring a toolbar modal form.
 */
export interface IToolbarModalFormFormProps<
    D extends Record<string, unknown> = ImageDOMAttrs,
> {
    /** Title of the modal form */
    readonly title?: string;
    /** Array of field configurations */
    readonly fields: IFormFieldConfig<D>[];
    /** Function to get initial data for the form */
    readonly initialData?: (state: EditorState) => Promise<D>;
    /** Callback when form is submitted */
    readonly onSubmit?: (state: EditorState, data: D) => void;
}

/**
 * Props for the toolbar modal form component.
 */
export interface IToolbarModalFormProps<
    D extends Record<string, unknown> = ImageDOMAttrs,
> {
    /** Whether the modal is open */
    readonly isOpen: boolean;
    /** Callback to close the modal */
    readonly onClose: VoidFunction;
    /** Reference to the trigger element for positioning */
    readonly triggerRef: React.RefObject<HTMLElement> | null;
    /** Form configuration props */
    readonly formProps: IToolbarModalFormFormProps<D>;
    /** ProseMirror editor view */
    readonly view: EditorView;
}
