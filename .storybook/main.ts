import type { StorybookConfig } from "@storybook/preact-vite";

const config: StorybookConfig = {
    stories: [
        "../stories/**/*.mdx",
        "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    ],
    addons: ["@storybook/addon-a11y"],
    framework: {
        name: "@storybook/preact-vite",
        options: {},
    },
};
export default config;
