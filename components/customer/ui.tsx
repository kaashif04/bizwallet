import Link from "next/link";

// One header and one section title for every customer screen.

export function PageHeader({ title, subtitle, back }: { title: string; subtitle?: string; back?: string }) {
  return (
    <header className="mb-6">
      {back && (
        <Link
          href={back}
          className="-ml-2 mb-2 inline-flex h-9 items-center gap-1 rounded-full px-2 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
        >
          <span aria-hidden="true">‹</span> Back
        </Link>
      )}
      <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-ink-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
    </header>
  );
}

export function SectionTitle({ children, href, action = "See all" }: { children: React.ReactNode; href?: string; action?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between px-1">
      <h2 className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">{children}</h2>
      {href && (
        <Link href={href} className="text-sm font-bold text-brand-700 hover:underline">
          {action}
        </Link>
      )}
    </div>
  );
}

export const screen = "mx-auto max-w-md px-4 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]";
