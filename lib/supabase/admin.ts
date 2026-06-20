import { createClient } from "@supabase/supabase-js";

// Service-role client. SERVER-ONLY — it bypasses RLS and can call privileged
// RPCs like top_up_wallet(). Never import this into a Client Component, and the
// key must never be prefixed with NEXT_PUBLIC.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
