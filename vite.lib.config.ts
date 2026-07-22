import path from "path"
import react from "@vitejs/plugin-react"
import dts from "vite-plugin-dts"
import { defineConfig } from "vite"

// Builds the publishable package (`pnpm build:lib`), as opposed to
// `vite.config.ts` which builds the local demo app. Peer packages (react,
// @tiptap/*, ...) stay external so consumers install them once themselves;
// only our own source and its `@/` alias imports get bundled into dist/index.js.
export default defineConfig({
    plugins: [
        react(),
        dts({
            tsconfigPath: "./tsconfig.app.json",
            include: ["src"],
            exclude: ["src/App.tsx", "src/main.tsx", "src/vite-env.d.ts"],
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
        lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            formats: ["es"],
            fileName: () => "index.js",
        },
        rollupOptions: {
            external: (id) => !id.startsWith(".") && !id.startsWith("@/") && !path.isAbsolute(id),
        },
    },
})
