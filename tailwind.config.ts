import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
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
        glass: "0 20px 60px -20px rgba(98, 48, 31, 0.35)",
      },
      keyframes: {
        "blob": {
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
