import { defineConfig } from "vite";

export default defineConfig({
    build: {
        sourcemap: true,
        rollupOptions: {
            input: "./js/index.js",
            output: {
                entryFileNames: "bundle.js",
                assetFileNames: (assetInfo) => {
                    return "bundle[extname]";
                },
            },
        },
    },
});
