const SYMBOLS: Record<string, string> = {
  MYR: "RM",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SGD: "S$",
};

export function currencySymbol(code: string): string {
  return SYMBOLS[code] ?? `${code} `;
}

// "5.00" -> "5", "7.50" -> "7.5" — discount_percentage is numeric(5,2) so
// always carries decimals even for whole-number tiers.
export function formatPercent(value: number): string {
  return (Math.round(value * 100) / 100).toString();
}
