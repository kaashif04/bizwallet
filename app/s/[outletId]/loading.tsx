// The restaurant home's shape while the server gathers it: logo, greeting, action, a card.
export default function StoreLoading() {
  return (
    <div className="min-h-dvh bg-ink-50">
      <div className="mx-auto max-w-md px-4 pb-28 pt-[calc(4.5rem+env(safe-area-inset-top))]">
        <div className="h-20 w-20 animate-pulse rounded-[1.5rem] bg-white" />
        <div className="mt-4 h-8 w-56 animate-pulse rounded bg-white" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-ink-100" />
        <div className="mt-6 h-12 animate-pulse rounded-2xl bg-white" />
        <div className="mt-8 h-56 animate-pulse rounded-3xl bg-white" />
        <div className="mt-8 h-20 animate-pulse rounded-3xl bg-white" />
      </div>
    </div>
  );
}
