import { IconKeys } from "@/plugins/icons";
import { MenuItemSpec } from "prosemirror-menu";
import { Command } from "prosemirror-state";

export interface TableToolbarButton {
    icon?: IconKeys;
    title: string;
    command: Command;
    run?: Command;
    isActive?: MenuItemSpec["active"];
}

export interface TableToolbarDropdown {
    icon: IconKeys;
    title: string;
    items: TableToolbarButton[];
}

export interface TableToolbarPosition {
    top: number;
    left: number;
}

export interface TableElementData {
    tableElement: Element;
    tableWrapper: Element;
}
