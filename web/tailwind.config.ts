import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0a",
        paper: "#0e0e10",
        rule: "#1f1f22",
        bone: "#d9d4c7",
        amber: { DEFAULT: "#8b5cf6", dim: "#5b21b6" },
        blood: "#c83737",
        court: "#2a2520",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
    },
  },
} satisfies Config;
