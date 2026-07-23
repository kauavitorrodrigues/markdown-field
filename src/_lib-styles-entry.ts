// Build-only: lets Tailwind's Vite plugin see every component file and
// compile the utility classes they use. Discarded by the build:lib script,
// dist/typeset.css is what actually ships.
import "./lib.css"
import "./index"

export {}
