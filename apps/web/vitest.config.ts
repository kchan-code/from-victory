import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Default env stays node so existing tests are untouched. Component tests
    // opt into jsdom per-file via a `@vitest-environment jsdom` docblock (FV-132).
    environment: "node",
  },
  // Vitest 4 transforms with Oxc (not esbuild), and tsconfig is "jsx": "preserve"
  // for Next — so configure the automatic JSX runtime on Oxc here, otherwise the
  // .tsx test files + imported components reach the parser as raw JSX. This is the
  // v4 equivalent of the old `esbuild: { jsx: "automatic" }`. (FV-133)
  oxc: {
    jsx: { runtime: "automatic" },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
