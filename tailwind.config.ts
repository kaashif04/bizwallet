import type { Config } from "tailwindcss";

// Warm "roast" neutrals. Replaces Tailwind's cool slate everywhere (the app
// uses slate-* ~600 times) so grays sit in the same hue family as the coffee
// brand instead of fighting it.
const roast = {
  50: "#faf7f4",
  100: "#f3eee8",
  200: "#e6ded5",
  300: "#d2c6b9",
  400: "#a3927f",
  500: "#7a6a5a",
  600: "#5f5245",
  700: "#4a3f35",
  800: "#322a23",
  900: "#211b16",
  950: "#15100c",
};

// Shadows tinted with roast-900 instead of pure black, one light source (above).
const tint = "33 27 22";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      colors: {
        slate: roast,
        // Warm "coffee" brand accent used across the customer experience.
        brand: {
          50: "#fdf8f3",
          100: "#f8ecdf",
          200: "#efd4ba",
          300: "#e3b488",
          400: "#d68f57",
          500: "#c87234",
          600: "#b15a29",
          700: "#934524",
          800: "#773923",
          900: "#62301f",
        },
      },
      boxShadow: {
        sm: `0 1px 2px 0 rgb(${tint} / 0.06), 0 1px 3px 0 rgb(${tint} / 0.05)`,
        DEFAULT: `0 2px 4px -1px rgb(${tint} / 0.07), 0 1px 3px 0 rgb(${tint} / 0.06)`,
        md: `0 6px 14px -4px rgb(${tint} / 0.10), 0 2px 4px -2px rgb(${tint} / 0.06)`,
        lg: `0 14px 28px -8px rgb(${tint} / 0.16), 0 4px 8px -4px rgb(${tint} / 0.06)`,
        xl: `0 22px 44px -12px rgb(${tint} / 0.22), 0 8px 16px -8px rgb(${tint} / 0.08)`,
        "2xl": `0 32px 64px -16px rgb(${tint} / 0.30)`,
        glass: "0 20px 60px -20px rgba(98, 48, 31, 0.35)",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(24px, -32px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.95)" },
        },
      },
      animation: {
        blob: "blob 14s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
