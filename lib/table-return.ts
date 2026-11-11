// A table guest who opens their wallet (points, profile) from the table's page carries the
// table's QR token in ?table=, so every screen on the way can offer "Back to table"
// without a new scan (the visit itself is kept on the phone, see TableVisit).
export const tableParam = (v: string | string[] | undefined): string | null =>
  typeof v === "string" && /^[0-9a-f]{32}$/i.test(v) ? v : null;
export const tablePath = (token: string) => `/order/t/${token}`;
