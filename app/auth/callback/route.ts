import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth (Google) + magic-link callback. Supabase redirects here with a `code`
// we exchange for a session, then forward the user on.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const raw = searchParams.get("next");
  const next = raw?.startsWith("/") && !raw.startsWith("//") ? raw : "/customer/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // OAuth sign-ups can't carry app = 'bizwallet' metadata, so provision
      // the member here (no-op for existing members and BizPos staff).
      await supabase.rpc("ensure_member");
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
