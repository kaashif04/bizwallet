import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { companyKeys, quote } from "@/lib/lalamove";
import { customerFee, km } from "@/lib/delivery";
import { storeStatus } from "@/lib/hours";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The delivery fee for a dropped pin. Inside the branch's own-rider zone (straight-line km): its flat
// fee, no Lalamove. Further out: Lalamove's motorbike price + the branch's markup. Saved as a quote the
// order then points at (guest_place_order checks it), so the browser never sets the price.
// ponytail: no rate limit beyond the distance check; add one if quotes get spammed.
export async function POST(request: Request) {
  const { outlet_id, lat, lng, address } = await request.json().catch(() => ({}));
  if (
    typeof outlet_id !== "string" || !UUID.test(outlet_id) ||
    typeof lat !== "number" || typeof lng !== "number" || Math.abs(lat) > 90 || Math.abs(lng) > 180 ||
    typeof address !== "string" || address.trim().length < 3
  ) {
    return NextResponse.json({ error: "Choose your address from the list." }, { status: 400 });
  }
  const admin = createAdminClient();
  const [{ data: s }, { data: o }] = await Promise.all([
    admin
      .from("outlet_settings")
      .select("delivery_enabled, delivery_max_km, delivery_markup_rm, delivery_markup_pct, delivery_free_above, own_delivery_km, own_delivery_fee, own_delivery_free_above, store_lat, store_lng, store_address")
      .eq("outlet_id", outlet_id)
      .maybeSingle(),
    admin.from("outlets").select("name, address, company_id").eq("id", outlet_id).maybeSingle(),
  ]);
  if (!s?.delivery_enabled || s.store_lat == null || s.store_lng == null || !o?.company_id) {
    return NextResponse.json({ error: "Delivery isn't available here right now." }, { status: 404 });
  }
  // No drivers while the kitchen is closed (the app hides delivery then; this stops a stale page).
  const status = await storeStatus(admin, outlet_id);
  if (status && !status.open) {
    return NextResponse.json({ error: `We're closed now${status.opens ? `. Delivery starts again ${status.opens}` : ""}.` }, { status: 409 });
  }
  const store = { lat: Number(s.store_lat), lng: Number(s.store_lng) };
  const straight = km(store, { lat, lng });
  const freeAbove = s.delivery_free_above == null ? null : Number(s.delivery_free_above);
  // Quotes nobody ordered with are only kept a day.
  const sweep = () =>
    admin.from("deliveries").delete().eq("status", "quoted").lt("created_at", new Date(Date.now() - 86_400_000).toISOString());

  // The own rider only counts inside the branch's own-rider times (fn_own_delivery_on).
  const { data: ownOn } = await admin.rpc("fn_own_delivery_on", { p_outlet: outlet_id });
  const ownKm = ownOn && s.own_delivery_km != null ? Number(s.own_delivery_km) : null;
  if (ownKm != null && straight <= ownKm) {
    const fee = Number(s.own_delivery_fee);
    const expires = new Date(Date.now() + 30 * 60_000).toISOString(); // a flat fee; 30 min just keeps it fresh
    await sweep();
    const { data: row, error } = await admin
      .from("deliveries")
      .insert({
        outlet_id, own: true, quote_expires_at: expires, lalamove_price: 0, fee,
        distance_m: Math.round(straight * 1000), address: address.trim().slice(0, 300),
        lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6,
      })
      .select("id")
      .single();
    if (error) {
      console.error("own delivery quote", error);
      return NextResponse.json({ error: "Couldn't get a delivery price. Try again." }, { status: 502 });
    }
    return NextResponse.json({ id: row.id, fee, distance_km: Math.round(straight * 10) / 10, expires_at: expires, own: true,
      free_above: s.own_delivery_free_above == null ? null : Number(s.own_delivery_free_above) });
  }

  const keys = await companyKeys(o.company_id);
  if (!keys) {
    return ownKm == null
      ? NextResponse.json({ error: "Delivery isn't available here right now." }, { status: 404 })
      : NextResponse.json({ error: `Sorry, that's too far. We deliver up to ${ownKm} km.` }, { status: 400 });
  }
  const maxKm = Number(s.delivery_max_km);
  if (straight > maxKm) {
    return NextResponse.json({ error: `Sorry, that's too far. We deliver up to ${Math.max(maxKm, ownKm ?? 0)} km.` }, { status: 400 });
  }

  try {
    const q = await quote(keys, { ...store, address: s.store_address || o.address || o.name }, { lat, lng, address: address.trim() });
    const roadKm = Number(q.distance.value) / 1000;
    if (roadKm > maxKm) {
      return NextResponse.json({ error: `Sorry, that's ${roadKm.toFixed(1)} km by road. We deliver up to ${maxKm} km.` }, { status: 400 });
    }
    const price = Number(q.priceBreakdown.total);
    const fee = customerFee(price, Number(s.delivery_markup_rm), Number(s.delivery_markup_pct));
    await sweep();
    const { data: row, error } = await admin
      .from("deliveries")
      .insert({
        outlet_id,
        quotation_id: q.quotationId,
        quote_expires_at: q.expiresAt,
        lalamove_price: price,
        fee,
        distance_m: Math.round(Number(q.distance.value)),
        address: address.trim().slice(0, 300),
        lat: Math.round(lat * 1e6) / 1e6,
        lng: Math.round(lng * 1e6) / 1e6,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({
      id: row.id,
      fee,
      distance_km: Math.round(roadKm * 10) / 10,
      expires_at: q.expiresAt,
      free_above: freeAbove,
    });
  } catch (e) {
    console.error("delivery quote", e);
    return NextResponse.json({ error: "Couldn't get a delivery price. Check the address and try again." }, { status: 502 });
  }
}
