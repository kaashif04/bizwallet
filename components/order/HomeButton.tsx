import Link from "next/link";

// Way out of the ordering flow: the table's start page or the restaurant's page
// when known.
export default function HomeButton({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Home"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm transition hover:bg-brand-100 active:scale-90"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 11l8-7 8 7" />
        <path d="M6 10v9h4v-5h4v5h4v-9" />
      </svg>
    </Link>
  );
}
