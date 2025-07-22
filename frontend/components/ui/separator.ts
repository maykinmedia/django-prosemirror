import crelt from "crelt";

const prefix = "table-toolbar";

export const separator = crelt("div", {
    class: `${prefix}__separator`,
});

/**
 * Create the seperator with a function to make sure crelt
 * recognizes it as an own element - otherwise multiple
 * separators are populated as one seperator.
 */
export const dynamic_seperator = () => {
    return crelt("div", {
        class: `${prefix}__separator`,
    });
};
