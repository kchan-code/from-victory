import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Solid palette colors use the --fv-*-rgb channel vars (defined
        // beside their hex twins in globals.css) so Tailwind can generate
        // opacity modifiers — a bare var(--fv-x) value can't take
        // `<alpha-value>`, which silently drops every `text-cream/70`-style
        // class from the build (FV-530). Colors whose source var is already
        // rgba (hairline, *-soft) stay as plain vars: they carry their own
        // alpha and aren't used with modifiers.
        onyx: "rgb(var(--fv-onyx-rgb) / <alpha-value>)",
        charcoal: "rgb(var(--fv-charcoal-rgb) / <alpha-value>)",
        "surface-1": "rgb(var(--fv-surface-1-rgb) / <alpha-value>)",
        "surface-2": "rgb(var(--fv-surface-2-rgb) / <alpha-value>)",
        cream: "rgb(var(--fv-white-rgb) / <alpha-value>)",
        silver: "rgb(var(--fv-silver-rgb) / <alpha-value>)",
        gold: {
          DEFAULT: "rgb(var(--fv-gold-rgb) / <alpha-value>)",
          bright: "rgb(var(--fv-gold-bright-rgb) / <alpha-value>)",
          deep: "rgb(var(--fv-gold-deep-rgb) / <alpha-value>)",
          soft: "var(--fv-gold-soft)",
        },
        cobalt: {
          DEFAULT: "rgb(var(--fv-cobalt-rgb) / <alpha-value>)",
          bright: "rgb(var(--fv-cobalt-bright-rgb) / <alpha-value>)",
          soft: "var(--fv-cobalt-soft)",
        },
        navy: "rgb(var(--fv-navy-rgb) / <alpha-value>)",
        purple: "rgb(var(--fv-purple-rgb) / <alpha-value>)",
        success: "rgb(var(--fv-success-rgb) / <alpha-value>)",
        warning: "rgb(var(--fv-warning-rgb) / <alpha-value>)",
        danger: "rgb(var(--fv-danger-rgb) / <alpha-value>)",
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
