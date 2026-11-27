// The menu's shape while it loads (MenuView's header, chip tray and photo cards),
// so the page is there the moment the QR or link opens and the dishes fill in place.
export default function MenuSkeleton() {
  return (
    <div className="min-h-dvh bg-ink-50">
      <main className="mx-auto max-w-md" aria-busy="true" aria-label="Loading menu">
        <div className="flex items-center gap-3 px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-white" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-5 w-40 animate-pulse rounded-md bg-ink-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-ink-100" />
          </div>
          <div className="h-10 w-20 animate-pulse rounded-full bg-white" />
        </div>
        <div className="mx-5 mb-3 flex gap-1.5 rounded-full bg-white p-1.5 shadow-sm">
          <div className="h-9 w-20 animate-pulse rounded-full bg-accent-100" />
          {[64, 88, 72].map((w) => (
            <div key={w} className="h-9 animate-pulse rounded-full bg-ink-50" style={{ width: w }} />
          ))}
        </div>
        <div className="px-5 pt-6">
          <div className="mb-3 ml-1 h-6 w-32 animate-pulse rounded-md bg-ink-100" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-3xl bg-white p-2.5 shadow-sm">
                <div className="aspect-[4/3] animate-pulse rounded-2xl bg-ink-100" />
                <div className="mt-2.5 h-4 w-4/5 animate-pulse rounded bg-ink-100" />
                <div className="mt-2 flex items-center justify-between">
                  <div className="h-4 w-14 animate-pulse rounded bg-ink-100" />
                  <div className="h-10 w-10 rounded-full bg-ink-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
