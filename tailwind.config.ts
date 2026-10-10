import type { Config } from "tailwindcss";

// Soft neutral grays with a touch of warmth. Replaces Tailwind's cool slate
// everywhere (the app uses slate-* ~600 times).
const neutral = {
  50: "#fafaf9",
  100: "#f4f3f1",
  200: "#e7e5e2",
  300: "#d4d1cc",
  400: "#a29d96",
  500: "#736d66",
  600: "#5a544e",
  700: "#45403b",
  800: "#2e2a27",
  900: "#1f1c1a",
  950: "#141210",
};

// Shadows tinted warm brown instead of pure black, one light source (above).
const tint = "60 30 10";

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
        display: ["var(--font-display)", "var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        slate: neutral,
        // Juicy tangerine. 600 is the button colour: white text on it is 4.9:1.
        brand: {
          50: "#fff7f0",
          100: "#ffead9",
          200: "#ffd0ad",
          300: "#ffad75",
          400: "#ff8a3d",
          500: "#f26419",
          600: "#c4470b",
          700: "#a33a0b",
          800: "#82300e",
          900: "#6b2a10",
        },
        // Playful accents: stars/points, success, info, treats.
        sun: { 100: "#fff4cc", 300: "#ffdf6b", 500: "#ffc21a", 700: "#8a5a00" },
        mint: { 100: "#dcf7ec", 500: "#22b07d", 700: "#0f6b4a" },
        sky: { 100: "#dff0fd", 500: "#2f9be8", 700: "#145f99" },
        berry: { 100: "#ffe1ea", 500: "#f2477a", 700: "#a3184a" },
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
