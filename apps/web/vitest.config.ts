import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Default env stays node so existing tests are untouched. Component tests
    // opt into jsdom per-file via a `@vitest-environment jsdom` docblock (FV-132).
    environment: "node",
  },
  // Use the automatic JSX runtime (matches Next/tsconfig "jsx": "react-jsx"), so
  // neither test files nor components need an explicit `import React`. (FV-132)
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
