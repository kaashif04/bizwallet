// BizWallet mark: a wallet with a reward star. Inherits color from the parent.
export default function BrandMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 10a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V10Z" />
      <path d="M5 12h22" />
      <path d="M16 15.5l1.4 2.8 3.1.5-2.25 2.2.53 3.1L16 22.6l-2.78 1.5.53-3.1-2.25-2.2 3.1-.5L16 15.5Z" fill="currentColor" strokeWidth={1.2} />
    </svg>
  );
}
