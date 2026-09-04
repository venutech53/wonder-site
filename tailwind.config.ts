import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "var(--color-cream)",
        "cream-2": "var(--color-cream-2)",
        olive: "var(--color-olive)",
        "olive-light": "var(--color-olive-light)",
        charcoal: "var(--color-charcoal)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        "muted-light": "var(--color-muted-light)",
        "cream-text": "var(--color-cream-text)",
      },
      fontFamily: {
        sans: ["var(--font-roboto)", "ui-sans-serif", "system-ui", "sans-serif"],
        script: ["var(--font-homemade-apple)", "cursive"],
      },
    },
  },
};

export default config;
