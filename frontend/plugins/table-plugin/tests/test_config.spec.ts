import { describe, expect, it } from "vitest";
import { tableToolbarMenuConfig } from "../config";

describe("test config.ts function", () => {
    describe("tableToolbarMenuConfig", () => {
        it("should contain all expected menu items", () => {
            expect(tableToolbarMenuConfig()).toHaveLength(4);

            const [rowOps, colOps, cellOps, deleteTable] =
                tableToolbarMenuConfig();

            expect(rowOps.icon).toBe("rowDropdown");
            expect(rowOps.items).toHaveLength(4);

            expect(colOps.icon).toBe("columnDropdown");
            expect(colOps.items).toHaveLength(4);

            expect(cellOps.icon).toBe("cellDropdown");
            expect(cellOps.items).toHaveLength(2);

            expect(deleteTable.icon).toBe("deleteTable");
            expect(deleteTable.items).toBeUndefined();
        });

        it("should have working commands for all menu items", () => {
            tableToolbarMenuConfig().forEach((config) => {
                if (config.command) {
                    expect(typeof config.command).toBe("function");
                }

                if (config.items) {
                    config.items.forEach((item) => {
                        expect(typeof item.command).toBe("function");
                    });
                }
            });
        });
    });
});
