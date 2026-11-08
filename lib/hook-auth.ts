import { createAdminClient } from "@/lib/supabase/admin";

// BizPos / the database call us with "Authorization: Bearer <hook secret>" (kept in Vault, checked by the DB).
export async function hookAuthorized(request: Request): Promise<boolean> {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!bearer) return false;
  const { data } = await createAdminClient().rpc("wallet_hook_secret_ok", { p_secret: bearer });
  return !!data;
}
