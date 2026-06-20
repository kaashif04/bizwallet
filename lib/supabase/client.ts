import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Safe to use in Client Components — it only ever
// sees the public anon key.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  );
}
