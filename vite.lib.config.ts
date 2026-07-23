import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import dts from "vite-plugin-dts"
import { defineConfig } from "vite"

// Builds the publishable package (`pnpm build:lib`), as opposed to
// `vite.config.ts` which builds the local demo app. Peer packages (react,
// @tiptap/*, ...) stay external so consumers install them once themselves;
// only our own source and its `@/` alias imports get bundled into dist/index.js.
//
// The `_styles` lib entry only exists so the Tailwind plugin compiles the
// classes our components use into real CSS. `build:lib` discards its JS
// output and keeps only the CSS, renamed to `dist/typeset.css`.
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        dts({
            tsconfigPath: "./tsconfig.app.json",
            include: ["src"],
            exclude: ["src/App.tsx", "src/main.tsx", "src/vite-env.d.ts", "src/_lib-styles-entry.ts"],
            // Bundles every reachable module's types into a single dist/index.d.ts
            // covering just the public API, instead of emitting one .d.ts per
            // source file (which would leak internals like theme-provider/tabs).
            bundleTypes: true,
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
        copyPublicDir: false,
        // Without this, Vite coalesces CSS from every lib entry into one
        // `style.css`, and only `_styles` imports any CSS at all.
        cssCodeSplit: true,
        lib: {
            entry: {
                index: path.resolve(__dirname, "src/index.ts"),
                _styles: path.resolve(__dirname, "src/_lib-styles-entry.ts"),
            },
            formats: ["es"],
        },
        rollupOptions: {
            external: (id) => !id.startsWith(".") && !id.startsWith("@/") && !path.isAbsolute(id),
        },
    },
})
