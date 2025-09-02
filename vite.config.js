import { defineConfig } from "vite";
import { copyFileSync, mkdirSync } from "fs";
import path from "path";
import preact from "@preact/preset-vite";

export default defineConfig({
    build: {
        sourcemap: true,
        rollupOptions: {
            input: "./frontend/index.ts",
            output: {
                entryFileNames: "bundle.js",
                assetFileNames: (assetInfo) => {
                    return "bundle[extname]";
                },
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./frontend"),
        },
    },
    plugins: [
        preact(),
        {
            name: "copy-to-django",
            writeBundle() {
                const targets = ["django_prosemirror", "testapp"];
                try {
                    for (const target of targets) {
                        // Make sure the directories exist
                        mkdirSync(`${target}/static/js`, { recursive: true });
                        mkdirSync(`${target}/static/css`, { recursive: true });

                        const copyDict = {
                            "dist/bundle.js": `${target}/static/js/django-prosemirror.js`,
                            "dist/bundle.js.map": `${target}/static/js/bundle.js.map`,
                            "dist/bundle.css": `${target}/static/css/django-prosemirror.css`,
                        };

                        // Copy files.
                        Object.entries(copyDict).forEach(([src, dest]) => {
                            copyFileSync(src, dest);
                            console.log(`✓ Gekopieerd: ${src} → ${dest}`);
                        });
                    }
                } catch (error) {
                    console.warn("⚠️  Kopieer fout:", error.message);
                }
            },
        },
    ],

    test: {
        globals: true,
        environment: "jsdom",
        coverage: {
            include: ["frontend/**/*.ts", "frontend/**/*.tsx"],
            exclude: [
                "frontend/tests/**",
                "frontend/types/vite-env.d.ts",
                "node_modules/**",
                "dist/**",
                "django_prosemirror/**",
                "testapp/**",
            ],
            reporter: ["text", "html", "json"],
            all: true,
        },
    },
});
