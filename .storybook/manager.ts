import {
    defaultConfig,
    type TagBadgeParameters,
} from "storybook-addon-tag-badges";
import { addons } from "storybook/manager-api";

addons.setConfig({
    tagBadges: [
        // (Full/Partial schema)
        {
            tags: [{ prefix: "schema" }],
            badge({ getTagSuffix, tag }) {
                const suffix = getTagSuffix(tag),
                    full_schema = suffix == "full";
                if (full_schema) return { text: "Full schema", style: "pink" };
                return { text: "Partial schema", style: "purple" };
            },
        },
        {
            tags: "play-fn",
            badge: () => ({
                text: "Interactive",
                style: "green",
                tooltip: "This is a story that contains some interaction test.",
            }),
            display: {
                sidebar: false,
                toolbar: true,
            },
        },
        ...defaultConfig,
    ] satisfies TagBadgeParameters,
});
