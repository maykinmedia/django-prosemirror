import { addons } from "storybook/manager-api";
import {
    defaultConfig,
    type TagBadgeParameters,
} from "storybook-addon-tag-badges";

addons.setConfig({
    tagBadges: [
        // (Full/Partial schema)
        {
            tags: [{ prefix: "schema" }],
            badge({ getTagSuffix: e, tag: t2 }) {
                const r2 = e(t2),
                    full_schema = r2 == "full";
                if (full_schema) return { text: "Full schema", style: "pink" };
                return { text: "Partial schema", style: "purple" };
            },
        },
        {
            tags: "play-fn",
            badge: () => {
                return {
                    text: "Interactive",
                    style: "green",
                    tooltip:
                        "This is a story that contains some interaction test.",
                };
            },
            display: {
                sidebar: false,
                toolbar: true,
            },
        },
        // Place the default config after your custom matchers.
        ...defaultConfig,
    ] satisfies TagBadgeParameters,
});
