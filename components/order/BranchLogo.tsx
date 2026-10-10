import ItemMark from "./ItemMark";

// A branch's Hub logo, or its monogram when it has none.
export default function BranchLogo({ name, logoUrl, className }: { name: string; logoUrl?: string | null; className: string }) {
  if (!logoUrl) return <ItemMark name={name} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt={`${name} logo`} className={`shrink-0 bg-white object-contain p-1 ring-1 ring-slate-100 ${className}`} />
  );
}
