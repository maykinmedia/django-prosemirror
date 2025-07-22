import { deleteTable } from "prosemirror-tables";
import { translate } from "@/i18n/translations";
import { FloatingTableToolbarButton } from "../types";

export function createDeleteButtonConfig(): FloatingTableToolbarButton {
    return {
        icon: "deleteTable",
        title: translate("Delete table"),
        command: deleteTable,
    };
}
