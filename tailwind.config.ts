import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

// "Soft System", shared with BizEazy Hub and BizEazy Staff (~/BizEazy/DESIGN.md).
// Ivory paper, charcoal ink, one cobalt accent, mint/amber/coral for status,
// depth from paired light/shade shadows. Change the Hub first, then copy here.

type Ramp = Record<string | number, string>;

// Ink: ivory paper to charcoal. Text is charcoal, never black.
const ink = {
  50: "#F2EFE9", 100: "#E9E5DD", 200: "#DCD6CB", 300: "#C4BDB0", 400: "#9C958A", 500: "#6A645B",
  600: "#544F48", 700: "#3E3A35", 800: "#2A2825", 900: "#1C1B19", 950: "#121110",
};
// Cobalt: primary actions, progress, the active place.
const cobalt = {
  50: "#EEF3FF", 100: "#DCE6FF", 200: "#BACDFF", 300: "#8DADFF", 400: "#5A86F7", 500: "#2F64F0",
  600: "#1450E6", 700: "#0E40C2", 800: "#10369A", 900: "#132F78", 950: "#0C1C4A",
};
const emerald = { 50: "#E6FAF3", 100: "#C2F2E1", 500: "#00A877", 600: "#008A62", 700: "#006E4F" };
const amber = { 50: "#FFF7E6", 100: "#FFEBC2", 200: "#FFD98A", 300: "#FFC24D", 500: "#F09A00", 700: "#9A5C00", 800: "#7A4800" };
const rose = { 50: "#FFF1F0", 100: "#FFDEDB", 200: "#FFBCB6", 400: "#FF6257", 500: "#F04438", 600: "#D92D20", 700: "#B42318" };

// Dark mode (the Hub's night palette): night ground, charcoal cards, light
// ink. Tints become dark washes and the -700/-800 text shades turn light,
// so one class reads right in both modes. Follows the phone's setting.
const dark: Record<string, Ramp> = {
  ink: {
    50: "#121110", 100: "#2A2825", 200: "#3E3A35", 300: "#544F48", 400: "#6A645B", 500: "#9C958A",
    600: "#C4BDB0", 700: "#DCD6CB", 800: "#E9E5DD", 900: "#F2EFE9", 950: "#FBFAF7",
  },
  brand: {
    50: "#16213F", 100: "#1B2A55", 200: "#22346A", 300: "#2B4285", 400: "#8DADFF", 500: "#5A86F7",
    600: "#2F64F0", 700: "#5A86F7", 800: "#8DADFF", 900: "#BACDFF", 950: "#DCE6FF",
  },
  emerald: { 50: "#0D2A21", 100: "#123A2D", 500: "#12C48C", 600: "#4AD6A7", 700: "#4AD6A7" },
  amber: { 50: "#2E2108", 100: "#3D2C0A", 200: "#5C3600", 300: "#FFC24D", 500: "#FFB020", 700: "#FFC24D", 800: "#FFD98A" },
  rose: { 50: "#33130F", 100: "#451109", 200: "#7A271A", 400: "#FF8F86", 500: "#FF6257", 600: "#FF8F86", 700: "#FF8F86" },
};
const light: Record<string, Ramp> = { ink, brand: cobalt, emerald, amber, rose };

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");
const vars = (pal: Record<string, Ramp>, card: string) => ({
  "--card": rgb(card),
  ...Object.fromEntries(
    Object.entries(pal).flatMap(([name, ramp]) => Object.entries(ramp).map(([k, v]) => [`--${name}-${k}`, rgb(v)])),
  ),
});
const themed = (name: string) =>
  Object.fromEntries(Object.keys(light[name]).map((k) => [k, `rgb(var(--${name}-${k}) / <alpha-value>)`]));

const hl = "var(--nm-hl)";
const sh = "var(--nm-sh)";

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
        // bg-white is the card surface (charcoal in dark mode); text-on is the
        // fixed ivory for text on cobalt and on photos.
        white: "rgb(var(--card) / <alpha-value>)",
        on: "#FBFAF7",
        ink: themed("ink"),
        slate: themed("ink"),
        gray: themed("ink"),
        brand: themed("brand"),
        emerald: themed("emerald"),
        amber: themed("amber"),
        rose: themed("rose"),
        red: themed("rose"),
        // Old playful accents fold into the status trio and cobalt.
        sun: themed("amber"),
        mint: themed("emerald"),
        sky: themed("brand"),
        berry: themed("rose"),
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
  plugins: [
    plugin(({ addBase }) =>
      addBase({
        ":root": {
          ...vars(light, "#FBFAF7"),
          "--nm-hl": "rgb(255 255 255 / 0.85)",
          "--nm-sh": "rgb(122 104 78 / 0.2)",
          "color-scheme": "light dark",
        },
        "@media (prefers-color-scheme: dark)": {
          ":root": {
            ...vars({ ...light, ...dark }, "#1C1B19"),
            "--nm-hl": "rgb(255 255 255 / 0.035)",
            "--nm-sh": "rgb(0 0 0 / 0.55)",
          },
        },
      }),
    ),
  ],
};

export default config;
