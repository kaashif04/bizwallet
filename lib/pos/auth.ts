// Shared-secret authorization for the POS bridge endpoints. The POS sends the
// key in either `x-pos-api-key` or `Authorization: Bearer <key>`.
export function authorizePos(request: Request): boolean {
  const expected = process.env.POS_API_KEY;
  if (!expected) return false; // not configured -> deny everything

  const provided =
    request.headers.get("x-pos-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  // Constant-time-ish comparison to avoid leaking length/contents via timing.
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
