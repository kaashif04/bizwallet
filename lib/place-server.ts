import { cookies } from "next/headers";
import type { createClient } from "@/lib/supabase/server";
import { PLACE_COOKIE } from "./place";
import { lastPlaceId } from "./places";

// The restaurant this phone came from. Account pages (orders, offers, profile)
// show only that restaurant: each one stands alone.
export async function currentPlace(supabase: ReturnType<typeof createClient>) {
  const saved = cookies().get(PLACE_COOKIE)?.value;
  const id = saved && /^[0-9a-f-]{36}$/i.test(saved) ? saved : await lastPlaceId(supabase);
  if (!id) return null;
  const { data } = await supabase.rpc("guest_store", { p_outlet: id });
  return (data as { id: string; name: string; company_id: string } | null) ?? null;
}
