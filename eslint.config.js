// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "dist",
            "node_modules",
            "django_prosemirror/static/js",
            "testapp/static",
            "env",
            "coverage",
        ],
    },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: [
            "frontend/**/*.{ts,tsx}",
            "stories/**/*.stories.{ts,tsx}",
            ".storybook/**/*.{ts,tsx}",
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
    },
    storybook.configs["flat/recommended"],
);
