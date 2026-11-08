import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { voidBill } from "@/lib/pickup-payment";

// A guest cancels an order, or (table orders) switches it to pay at the counter. Any open Billplz bill
// is deleted first, so the order can't be paid afterwards.
export async function POST(request: Request) {
  const { order_id, claim_token, action } = await request.json().catch(() => ({}));
  if (typeof order_id !== "string" || typeof claim_token !== "string" || !["cancel", "counter"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data: order } = await admin.from("guest_orders").select("claim_token, payment_ref, status").eq("id", order_id).maybeSingle();
  if (!order || order.claim_token !== claim_token) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  try {
    // Only an unpaid order has a bill to kill; a paid one is cancelled (and refunded) as usual.
    if (order.status === "awaiting_payment" && order.payment_ref && (await voidBill(order.payment_ref)).paid) {
      return NextResponse.json({ error: "Your payment just went through, so the order stands." }, { status: 409 });
    }
    const { error } =
      action === "cancel"
        ? await admin.rpc("guest_cancel_order", { p_id: order_id, p_claim_token: claim_token })
        : await admin.rpc("fn_guest_switch_to_counter", { p_id: order_id });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
