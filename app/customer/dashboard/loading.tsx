export default function DashboardLoading() {
  return (
    <div className="min-h-dvh bg-brand-50">
      <div className="mx-auto max-w-md px-5 pb-36 pt-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
          <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
        </div>

        <div className="mt-5 space-y-6">
          <div className="h-44 animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-44 animate-pulse rounded-3xl bg-slate-200" />

          <div className="space-y-3">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
            <div className="flex gap-3 overflow-hidden">
              <div className="h-24 w-64 shrink-0 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-24 w-64 shrink-0 animate-pulse rounded-2xl bg-slate-200" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
