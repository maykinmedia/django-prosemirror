import type { StorybookConfig } from "@storybook/preact-vite";

const config: StorybookConfig = {
    stories: [
        "../stories/**/*.mdx",
        "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    ],
    addons: ["@storybook/addon-a11y", "storybook-addon-tag-badges"],
    framework: {
        name: "@storybook/preact-vite",
        options: {},
    },
    core: {
        disableWhatsNewNotifications: true,
    },
};
export default config;
