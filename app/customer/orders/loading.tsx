export default function OrdersLoading() {
  return (
    <div className="min-h-dvh bg-brand-50">
      <div className="mx-auto max-w-md px-5 pb-28 pt-6">
        <div className="h-7 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-44 animate-pulse rounded bg-slate-100" />
        <div className="mt-5 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
