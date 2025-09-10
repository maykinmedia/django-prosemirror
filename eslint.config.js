import js from "@eslint/js";
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
    {
        rules: {
            "quote-props": ["warn", "consistent-as-needed"],
        },
    },
    {
        files: ["frontend/**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.builtin,
                ...globals.browser,
            },
        },
    },
]);
