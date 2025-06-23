import { defineConfig } from "vite";
import { copyFileSync, mkdirSync } from "fs";

export default defineConfig({
    build: {
        sourcemap: true,
        rollupOptions: {
            // ? Change foldername to 'frontend', since it holds both scss and js.
            input: "./js/index.ts",
            output: {
                entryFileNames: "bundle.js",
                assetFileNames: (assetInfo) => {
                    return "bundle[extname]";
                },
            },
        },
    },
    plugins: [
        {
            name: "copy-to-django-dev-mode",
            apply: ({ mode }) => Boolean(mode == "dev"),
            writeBundle() {
                // Zorg ervoor dat de doelmappen bestaan
                mkdirSync("django_prosemirror/static/js", { recursive: true });
                mkdirSync("django_prosemirror/static/css", { recursive: true });

                // Kopieer bestanden
                try {
                    // ===== DJANGO_PROSEMIRROR STATIC ===== //
                    // django-prosemirror.js
                    copyFileSync(
                        "dist/bundle.js",
                        "django_prosemirror/static/js/django-prosemirror.js",
                    );
                    console.log(
                        "✓ Gekopieerd (prosemirror): bundle.js → django-prosemirror.js",
                    );
                    // bundle.js.map
                    copyFileSync(
                        "dist/bundle.js.map",
                        "django_prosemirror/static/js/bundle.js.map",
                    );
                    console.log(
                        "✓ Gekopieerd (django_prosemirror): bundle.js.map",
                    );
                    // django-prosemirror.css
                    copyFileSync(
                        "dist/bundle.css",
                        "django_prosemirror/static/css/django-prosemirror.css",
                    );
                    console.log(
                        "✓ Gekopieerd: bundle.css (django_prosemirror) → django-prosemirror.css",
                    );
                    // ===== TESTAPP STATIC ===== //
                    // django-prosemirror.js
                    copyFileSync(
                        "dist/bundle.js",
                        "testapp/static/js/django-prosemirror.js",
                    );
                    console.log(
                        "✓ Gekopieerd (testapp): bundle.js → django-prosemirror.js",
                    );
                    // bundle.js.map
                    copyFileSync(
                        "dist/bundle.js.map",
                        "testapp/static/js/bundle.js.map",
                    );
                    console.log("✓ Gekopieerd (testapp): bundle.js.map");
                    // django-prosemirror.css
                    copyFileSync(
                        "dist/bundle.css",
                        "testapp/static/css/django-prosemirror.css",
                    );
                    console.log(
                        "✓ Gekopieerd: bundle.css (testapp) → django-prosemirror.css",
                    );
                } catch (error) {
                    console.warn("⚠️  Kopieer fout:", error.message);
                }
            },
        },
    ],
});
