// Dishes without a photo get a monogram in one of the playful accent tones,
// picked from the name so the same dish always looks the same.
const TONES = [
  { bg: "#ffead9", fg: "#a33a0b" }, // tangerine
  { bg: "#dcf7ec", fg: "#0f6b4a" }, // mint
  { bg: "#ffe1ea", fg: "#a3184a" }, // berry
  { bg: "#dff0fd", fg: "#145f99" }, // sky
  { bg: "#fff4cc", fg: "#8a5a00" }, // sun
];

export default function ItemMark({ name, className = "" }: { name: string; className?: string }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const tone = TONES[h % TONES.length];
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 select-none items-center justify-center font-display font-semibold ${className}`}
      style={{ background: tone.bg, color: tone.fg }}
    >
      {name.trim().charAt(0).toUpperCase() || "·"}
    </span>
  );
}
