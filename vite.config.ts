import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        // `dist/` is reserved for the publishable package output (see
        // `vite.lib.config.ts` / `pnpm build:lib`); the demo app builds here instead.
        outDir: "demo-dist",
    },
})
