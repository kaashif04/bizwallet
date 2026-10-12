// Dishes without a photo get a monogram in a pressed ivory well.
export default function ItemMark({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 select-none items-center justify-center bg-ink-50 font-semibold text-ink-500 shadow-well ${className}`}
    >
      {name.trim().charAt(0).toUpperCase() || "·"}
    </span>
  );
}
