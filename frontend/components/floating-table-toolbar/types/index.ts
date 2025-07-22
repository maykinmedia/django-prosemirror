import { EditorState, Transaction } from "prosemirror-state";

export interface FloatingTableToolbarButton {
    icon?: string;
    title: string;
    command: (
        state: EditorState,
        dispatch?: (tr: Transaction) => void,
    ) => boolean;
    run?: (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;
    isActive?: (state: EditorState) => boolean;
}

export interface FloatingTableToolbarDropdown {
    icon: string;
    title: string;
    items: FloatingTableToolbarButton[];
}

export interface ToolbarPosition {
    top: number;
    left: number;
}

export interface TableElementData {
    tableElement: Element;
    tableWrapper: Element;
}
