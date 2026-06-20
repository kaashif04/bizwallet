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
