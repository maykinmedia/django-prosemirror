import crelt from "crelt";
import { TABLE_TOOLBAR_CLS } from "./config";

// Main export
export * from "./TableToolbar";

// Types
export type * from "./types";

// Components
export * from "./ButtonComponent";
export * from "./DropdownComponent";

// Utils
export * from "./utils";

// Config
export * from "./config";

export const separator = crelt("div", {
    class: TABLE_TOOLBAR_CLS.separator,
});
