import { NextResponse } from "next/server";
import { hookAuthorized } from "@/lib/hook-auth";
import { cancelBillPayment } from "@/lib/pickup-payment";

// The BizPos till calls this when staff tap "Cancel phone payment".
export async function POST(request: Request) {
  if (!(await hookAuthorized(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { payment_ref } = await request.json().catch(() => ({}));
  if (typeof payment_ref !== "string" || !payment_ref) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, ...(await cancelBillPayment(payment_ref)) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
