import { currencySymbol } from "@/lib/format";

// A dish's price; during a menu deal, the normal price struck out and what you save ("Save RM5").
export default function Price({
  price,
  regular,
  currency = "MYR",
  className = "",
  tag = true,
}: {
  price: number;
  regular?: number | null;
  currency?: string;
  className?: string;
  tag?: boolean;
}) {
  const sym = currencySymbol(currency);
  const deal = regular != null && regular > price;
  const off = deal ? regular - price : 0;
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-1.5 ${className}`}>
      <span className={deal ? "text-brand-700" : undefined}>
        {sym}
        {price.toFixed(2)}
      </span>
      {deal && (
        <>
          <s className="text-[0.85em] font-medium text-ink-400">
            <span className="sr-only">was </span>
            {sym}
            {regular.toFixed(2)}
          </s>
          {tag && (
            <span className="self-center whitespace-nowrap rounded-full bg-brand-600 px-2 py-0.5 text-2xs font-bold text-on">
              Save {sym}
              {Number.isInteger(Math.round(off * 100) / 100) ? off.toFixed(0) : off.toFixed(2)}
            </span>
          )}
        </>
      )}
    </span>
  );
}
