// The restaurant this phone last came from (table QR, receipt QR or its link).
// BizWallet has no app-wide home: signing in or opening the bare domain lands there.
export const PLACE_COOKIE = "bw_place";

export const placeHome = (outletId?: string | null) =>
  outletId && /^[0-9a-f-]{36}$/i.test(outletId) ? `/s/${outletId}` : "/customer/dashboard";

export function rememberPlace(outletId: string) {
  document.cookie = `${PLACE_COOKIE}=${outletId}; path=/; max-age=31536000; samesite=lax`;
}

export function rememberedHome(): string {
  return placeHome(document.cookie.match(/(?:^|; )bw_place=([^;]+)/)?.[1]);
}
