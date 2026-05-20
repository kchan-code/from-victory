import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        onyx: "var(--fv-onyx)",
        charcoal: "var(--fv-charcoal)",
        "surface-1": "var(--fv-surface-1)",
        "surface-2": "var(--fv-surface-2)",
        cream: "var(--fv-white)",
        silver: "var(--fv-silver)",
        gold: {
          DEFAULT: "var(--fv-gold)",
          bright: "var(--fv-gold-bright)",
          deep: "var(--fv-gold-deep)",
          soft: "var(--fv-gold-soft)",
        },
        cobalt: {
          DEFAULT: "var(--fv-cobalt)",
          bright: "var(--fv-cobalt-bright)",
          soft: "var(--fv-cobalt-soft)",
        },
        navy: "var(--fv-navy)",
        purple: "var(--fv-purple)",
        success: "var(--fv-success)",
        warning: "var(--fv-warning)",
        danger: "var(--fv-danger)",
        hairline: {
          DEFAULT: "var(--fv-hairline)",
          strong: "var(--fv-hairline-2)",
        },
      },
      fontFamily: {
        display: "var(--font-display)",
        heading: "var(--font-heading)",
        body: "var(--font-body)",
        scripture: "var(--font-scripture)",
        mono: "var(--font-mono)",
      },
      borderRadius: {
        xs: "var(--r-xs)",
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
        pill: "var(--r-pill)",
      },
      boxShadow: {
        "elev-1": "var(--shadow-1)",
        "elev-2": "var(--shadow-2)",
        "elev-3": "var(--shadow-3)",
        "glow-gold": "var(--shadow-glow-gold)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
        soft: "var(--ease-soft)",
      },
      transitionDuration: {
        fast: "var(--d-fast)",
        base: "var(--d-base)",
        slow: "var(--d-slow)",
        prayer: "var(--d-prayer)",
      },
    },
  },
  plugins: [],
};

export default config;
