import js from "@eslint/js";
import storybook from "eslint-plugin-storybook";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
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
    js.configs.recommended,
    ...tseslint.configs.recommended,
    storybook.configs["flat/recommended"],
    {
        rules: {
            "quote-props": ["warn", "consistent-as-needed"],
        },
    },
    {
        files: [
            "frontend/**/*.{ts,tsx}",
            "stories/**/*.stories.{ts,tsx}",
            ".storybook/**/*.{ts,tsx}",
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.builtin,
                ...globals.browser,
            },
        },
    },
]);
