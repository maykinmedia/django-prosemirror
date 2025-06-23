import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist", "node_modules", "django_prosemirror/static/js", "testapp/static", "env"] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ["js/**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
    },
);
