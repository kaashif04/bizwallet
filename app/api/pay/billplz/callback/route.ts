import { NextResponse } from "next/server";
import { confirmBill } from "@/lib/pickup-payment";

// Billplz posts here (server to server) when a bill changes. We only take the
// bill id from it; confirmBill re-reads the bill from Billplz before trusting it.
export async function POST(request: Request) {
  const id = (await request.formData().catch(() => null))?.get("id");
  if (typeof id !== "string" || !id) return NextResponse.json({ error: "Missing bill id" }, { status: 400 });
  try {
    await confirmBill(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
