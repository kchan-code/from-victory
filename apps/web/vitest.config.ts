import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Default env stays node so existing tests are untouched. Component tests
    // opt into jsdom per-file via a `@vitest-environment jsdom` docblock (FV-132).
    environment: "node",
    // Reporting-only for now (FV-380) — no thresholds, so this can never fail
    // CI. Once coverage has run for a while and we know a realistic floor,
    // add `thresholds` here.
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      // picomatch matches "include" with `contains: true`, so "lib/**" also
      // matches nested dirs like scripts/lib/** — exclude those explicitly to
      // keep the report scoped to the top-level apps/web/lib/ tree.
      include: ["lib/**"],
      exclude: [
        "scripts/**",
        "lib/**/*.d.ts",
        "lib/**/__tests__/**",
        "lib/**/*.test.ts",
        "lib/**/*.test.tsx",
      ],
    },
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
