import type { Config } from "tailwindcss";

// "Soft System", shared with BizEazy Hub and BizEazy Staff (~/BizEazy/DESIGN.md).
// Ivory paper, charcoal ink, one cobalt accent, mint/amber/coral for status,
// depth from paired light/shade shadows. Change the Hub first, then copy here.

// Ink: ivory paper to charcoal. Text is charcoal, never black.
const ink = {
  50: "#F2EFE9",
  100: "#E9E5DD",
  200: "#DCD6CB",
  300: "#C4BDB0",
  400: "#9C958A",
  500: "#6A645B",
  600: "#544F48",
  700: "#3E3A35",
  800: "#2A2825",
  900: "#1C1B19",
  950: "#121110",
};

// Cobalt: primary actions, progress, the active place.
const cobalt = {
  50: "#EEF3FF",
  100: "#DCE6FF",
  200: "#BACDFF",
  300: "#8DADFF",
  400: "#5A86F7",
  500: "#2F64F0",
  600: "#1450E6",
  700: "#0E40C2",
  800: "#10369A",
  900: "#132F78",
  950: "#0C1C4A",
};

const emerald = { 50: "#E6FAF3", 100: "#C2F2E1", 500: "#00A877", 600: "#008A62", 700: "#006E4F" };
const amber = { 50: "#FFF7E6", 100: "#FFEBC2", 200: "#FFD98A", 300: "#FFC24D", 500: "#F09A00", 700: "#9A5C00", 800: "#7A4800" };
const rose = { 50: "#FFF1F0", 100: "#FFDEDB", 200: "#FFBCB6", 400: "#FF6257", 500: "#F04438", 600: "#D92D20", 700: "#B42318" };

const hl = "rgb(255 255 255 / 0.85)";
const sh = "rgb(122 104 78 / 0.2)";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        // One family carries everything; display is kept as an alias.
        display: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: { "2xs": ["0.6875rem", "1.09rem"] },
      colors: {
        white: "#FBFAF7",
        ink,
        slate: ink,
        gray: ink,
        brand: cobalt,
        emerald,
        amber,
        rose,
        red: rose,
        // Old playful accents fold into the status trio and cobalt.
        sun: amber,
        mint: emerald,
        sky: cobalt,
        berry: rose,
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "1.5rem",
        sheet: "1.25rem",
      },
      boxShadow: {
        xs: `-1px -1px 2px ${hl}, 1px 1px 3px ${sh}`,
        sm: `-3px -3px 8px ${hl}, 4px 4px 10px ${sh}`,
        DEFAULT: `-3px -3px 8px ${hl}, 4px 4px 10px ${sh}`,
        md: `-5px -5px 12px ${hl}, 6px 6px 16px ${sh}`,
        lg: `-8px -8px 20px ${hl}, 10px 10px 26px ${sh}`,
        xl: `-10px -10px 28px ${hl}, 16px 16px 40px ${sh}`,
        "2xl": `-10px -10px 28px ${hl}, 16px 16px 40px ${sh}`,
        glass: `-10px -10px 28px ${hl}, 16px 16px 40px ${sh}`,
        pressed: `inset 2px 2px 5px ${sh}, inset -2px -2px 5px ${hl}`,
        well: `inset 1px 1px 3px ${sh}, inset -1px -1px 3px ${hl}`,
        sheet: "0 -10px 40px -12px rgb(42 32 22 / 0.22)",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
    },
  },
  plugins: [],
};

export default config;
