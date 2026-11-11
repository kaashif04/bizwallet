// Dishes without a photo get their initial on a soft brand-tinted tile.
export default function ItemMark({ name, className = "", tone = "brand" }: { name: string; className?: string; tone?: "brand" | "accent" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 select-none items-center justify-center bg-gradient-to-br ${tone === "accent" ? "from-accent-50 to-accent-100 text-accent-700" : "from-brand-50 to-brand-100 text-brand-700/80"} font-semibold ${className}`}
    >
      {name.trim().charAt(0).toUpperCase() || "·"}
    </span>
  );
}
