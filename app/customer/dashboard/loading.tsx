// Same shape as Home: header, quick actions, offers, a place card.
export default function DashboardLoading() {
  const block = "animate-pulse rounded-2xl bg-white";
  return (
    <div className="min-h-dvh bg-ink-50">
      <div className="mx-auto max-w-md px-4 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-full bg-white" />
            <div className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-ink-100" />
              <div className="h-4 w-28 animate-pulse rounded bg-ink-100" />
            </div>
          </div>
          <div className="h-11 w-11 animate-pulse rounded-full bg-white" />
        </div>

        <div className="mt-6 space-y-8">
          <div className="grid grid-cols-3 gap-3">
            <div className={`h-28 ${block}`} />
            <div className={`h-28 ${block}`} />
            <div className={`h-28 ${block}`} />
          </div>
          <div className={`aspect-video ${block}`} />
          <div className={`h-72 ${block}`} />
        </div>
      </div>
    </div>
  );
}
