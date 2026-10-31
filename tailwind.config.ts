import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

// "Order chit": BizWallet's own world (no longer the BizEazy Soft System).
// Every screen is the restaurant's order pad: warm-white paper chits on a cool
// laminate tabletop, carbon-blue ink, a pink carbon-copy band, stamp red for state.
// See DESIGN.md.

type Ramp = Record<string | number, string>;

// Ink: laminate tabletop to charcoal. ink-50 is the table; text is ink-900.
const ink = {
  50: "#E7EAEE", 100: "#DCE0E6", 200: "#C9CFD8", 300: "#AAB2BE", 400: "#858E9C", 500: "#5E6675",
  600: "#4A5160", 700: "#363C48", 800: "#252A33", 900: "#171A21", 950: "#0E1015",
};
// Carbon blue: the copy-paper ink. 600 is the button (paper text on it is 9:1).
const carbon = {
  50: "#EEF0FB", 100: "#DCE1F7", 200: "#B9C3EF", 300: "#8E9DE2", 400: "#6476D3", 500: "#3F52BE",
  600: "#2A3A9E", 700: "#223085", 800: "#1B266A", 900: "#141C4F", 950: "#0C1133",
};
const emerald = { 50: "#E6F6EE", 100: "#C6EBD8", 500: "#1E9E5E", 600: "#17844E", 700: "#11693E" };
const amber = { 50: "#FFF6E3", 100: "#FDE8BC", 200: "#F9D47E", 300: "#F2B940", 500: "#D98E00", 700: "#8F5B00", 800: "#6F4600" };
const rose = { 50: "#FDEEF0", 100: "#FAD6DB", 200: "#F3AEB8", 400: "#E2566B", 500: "#D33049", 600: "#C8102E", 700: "#A10C25" };
// The pink carbon-copy band and the rubber stamp.
const paper = { band: "#F5CDD5", stamp: "#C8102E", rule: "#D6DDEF" };

// Night: carbon-paper chits on a near-black table, luminous carbon ink.
const dark: Record<string, Ramp> = {
  ink: {
    50: "#0D1015", 100: "#1E232C", 200: "#2A303B", 300: "#3A4150", 400: "#5A6272", 500: "#8C95A5",
    600: "#AEB6C4", 700: "#CBD1DB", 800: "#DFE3EA", 900: "#EEF1F5", 950: "#F8F9FB",
  },
  brand: {
    50: "#161C33", 100: "#1C2442", 200: "#26305A", 300: "#34428A", 400: "#8C9CFF", 500: "#A3B1FF",
    600: "#4C5FE0", 700: "#A9B6FF", 800: "#C4CDFF", 900: "#DCE1FF", 950: "#EEF1FF",
  },
  emerald: { 50: "#0E2419", 100: "#133222", 500: "#3CCB82", 600: "#5BD99A", 700: "#5BD99A" },
  amber: { 50: "#2B2008", 100: "#3A2B0A", 200: "#5C3E00", 300: "#F2B940", 500: "#FFB52E", 700: "#F7C65C", 800: "#F9D47E" },
  rose: { 50: "#2E1218", 100: "#40161F", 200: "#6E2232", 400: "#FF8094", 500: "#FF5C6C", 600: "#FF7A88", 700: "#FF8D99" },
  paper: { band: "#3B2531", stamp: "#FF5C6C", rule: "#2A3352" },
};
const light: Record<string, Ramp> = { ink, brand: carbon, emerald, amber, rose, paper };

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
        // Archivo carries everything; pad headers and totals use its expanded width (.pad).
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        // Old gradient names, now solid carbon ink (progress fills, legacy cards).
        marple: "linear-gradient(rgb(var(--brand-600)), rgb(var(--brand-600)))",
        "marple-card": "linear-gradient(rgb(var(--brand-600)), rgb(var(--brand-600)))",
      },
      fontSize: { "2xs": ["0.6875rem", "1.09rem"] },
      colors: {
        // bg-white is chit paper (carbon paper at night); text-on is paper-white
        // for text on carbon-blue buttons and photos.
        white: "rgb(var(--card) / <alpha-value>)",
        on: "#FFFDF8",
        paper: themed("paper"),
        ink: themed("ink"),
        slate: themed("ink"),
        gray: themed("ink"),
        brand: themed("brand"),
        emerald: themed("emerald"),
        amber: themed("amber"),
        rose: themed("rose"),
        red: themed("rose"),
        // Old playful accents fold into the status trio and the accent.
        sun: themed("amber"),
        mint: themed("emerald"),
        sky: themed("brand"),
        berry: themed("rose"),
      },
      // Paper is cut, not moulded: small radii.
      borderRadius: {
        lg: "0.375rem",
        xl: "0.5rem",
        "2xl": "0.5rem",
        "3xl": "0.625rem",
        sheet: "0.875rem",
      },
      // Paper lifted off the table: offset, soft, one light from above.
      boxShadow: {
        xs: `0 1px 2px ${sh}`,
        sm: `0 1px 0 ${hl}, 0 2px 4px -1px ${sh}, 0 8px 18px -10px ${sh}`,
        DEFAULT: `0 1px 0 ${hl}, 0 2px 4px -1px ${sh}, 0 8px 18px -10px ${sh}`,
        md: `0 2px 4px -1px ${sh}, 0 12px 24px -12px ${sh}`,
        lg: `0 4px 8px -2px ${sh}, 0 18px 36px -16px ${sh}`,
        xl: `0 6px 12px -4px ${sh}, 0 24px 48px -20px ${sh}`,
        "2xl": `0 6px 12px -4px ${sh}, 0 24px 48px -20px ${sh}`,
        glass: `0 6px 12px -4px ${sh}, 0 24px 48px -20px ${sh}`,
        pressed: `inset 0 0 0 1px rgb(var(--ink-200))`,
        well: `inset 0 0 0 1px rgb(var(--ink-200))`,
        sheet: `0 -8px 32px -12px ${sh}`,
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
    // Auto follows the phone; Profile > Appearance can pin light or dark
    // (html[data-theme], set before paint in app/layout.tsx).
    plugin(({ addBase }) => {
      const darkVars = {
        ...vars({ ...light, ...dark }, "#171B23"),
        "--nm-hl": "rgb(255 255 255 / 0.04)",
        "--nm-sh": "rgb(0 0 0 / 0.6)",
        "color-scheme": "dark",
      };
      addBase({
        ":root": {
          ...vars(light, "#FFFDF8"),
          "--nm-hl": "rgb(255 255 255 / 0.9)",
          "--nm-sh": "rgb(23 32 56 / 0.18)",
          "color-scheme": "light",
        },
        "@media (prefers-color-scheme: dark)": { ':root:not([data-theme="light"])': darkVars },
        ':root[data-theme="dark"]': darkVars,
      });
    }),
  ],
};

export default config;
