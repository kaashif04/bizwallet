export default function OrdersLoading() {
  return (
    <div className="min-h-dvh bg-ink-50">
      <div className="mx-auto max-w-md px-4 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="h-7 w-32 animate-pulse rounded bg-white" />
        <div className="mt-2 h-4 w-44 animate-pulse rounded bg-ink-100" />
        <div className="mt-5 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
