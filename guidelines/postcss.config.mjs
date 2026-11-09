import { fileURLToPath } from "node:url";

// Absolute path: Turbopack resolves plugins from a directory other than the project root.
const docsCss = fileURLToPath(new URL("./postcss/docs-css.mjs", import.meta.url));

const config = {
  plugins: {
    // Before Tailwind: handles the custom `@import … (docs-version: …)` and
    // `@import … (docs-theme-previews)` conditions (see postcss/docs-css.mjs).
    [docsCss]: {},
    "@tailwindcss/postcss": {},
  },
};

export default config;
