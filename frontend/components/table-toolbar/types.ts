import { IconKeys } from "@/plugins/icons";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

export interface IToolbarMenuItem {
    icon?: IconKeys;
    title: string;
    command: (
        state: EditorState,
        dispatch?: (tr: Transaction) => void,
    ) => boolean;
    run?: (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;
    isActive?: (view: EditorView) => boolean;
}

export type ButtonOrDropdown = ButtonOptions & {
    items?: IToolbarMenuItem[];
};

export interface ButtonOptions {
    title?: string;
    class?: string;
    icon?: IconKeys;
    disabled?: boolean;
    command?: (
        state: EditorState,
        dispatch?: (tr: Transaction) => void,
    ) => boolean;
    isActive?: (view: EditorView) => boolean;
}
