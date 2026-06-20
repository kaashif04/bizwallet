import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

// Current authenticated user (or null). Resilient so the page doesn't crash
// when Supabase is unreachable.
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

// Super Admins are an allowlist of emails (SUPER_ADMIN_EMAILS, comma-separated)
// rather than a DB role — no schema migration, easy to manage. Distinct from
// the per-outlet `owner` role.
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const allow = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}
