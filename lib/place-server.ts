import { cookies } from "next/headers";
import type { createClient } from "@/lib/supabase/server";
import { PLACE_COOKIE } from "./place";

// The restaurant this phone came from. Account pages (orders, offers, profile)
// show only that restaurant: each one stands alone.
export async function currentPlace(supabase: ReturnType<typeof createClient>) {
  const id = cookies().get(PLACE_COOKIE)?.value;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await supabase.rpc("guest_store", { p_outlet: id });
  return (data as { id: string; name: string; company_id: string } | null) ?? null;
}
