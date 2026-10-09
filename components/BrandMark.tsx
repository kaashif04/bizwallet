// BizCafé mark: a cup with rising steam. Inherits color from the parent.
export default function BrandMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 13h17v6a7 7 0 0 1-7 7h-3a7 7 0 0 1-7-7v-6Z" />
      <path d="M23 15h1.5a3.5 3.5 0 0 1 0 7H22" />
      <path d="M11 4c-1.5 1.5 1.5 3 0 5M16 4c-1.5 1.5 1.5 3 0 5" />
    </svg>
  );
}
