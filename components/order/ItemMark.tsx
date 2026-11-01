// Dishes without a photo get their initial on a soft brand-tinted tile.
export default function ItemMark({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 select-none items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 font-semibold text-brand-700/80 ${className}`}
    >
      {name.trim().charAt(0).toUpperCase() || "·"}
    </span>
  );
}
