// Menu items arrive from BizPos without photos. Instead of a generic emoji,
// each item gets a monogram in one of a few warm "menu board" tones, picked
// from its name so the same drink always looks the same.
const TONES = [
  { bg: "#f8ecdf", fg: "#934524" }, // caramel
  { bg: "#e7eedd", fg: "#47662a" }, // matcha
  { bg: "#f5e2e2", fg: "#8b3a45" }, // berry
  { bg: "#ece2d8", fg: "#5a3d2b" }, // cocoa
  { bg: "#faefd2", fg: "#80530f" }, // honey
];

export default function ItemMark({ name, className = "" }: { name: string; className?: string }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const tone = TONES[h % TONES.length];
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 select-none items-center justify-center font-display font-semibold ${className}`}
      style={{ background: tone.bg, color: tone.fg, fontVariationSettings: '"SOFT" 100' }}
    >
      {name.trim().charAt(0).toUpperCase() || "·"}
    </span>
  );
}
