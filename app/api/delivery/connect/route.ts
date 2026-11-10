import { NextResponse } from "next/server";
import { hookAuthorized } from "@/lib/hook-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { companyKeys, lalamove } from "@/lib/lalamove";

// The owner saved Lalamove keys (set_lalamove_keys): check they work and send Lalamove's status
// updates for this account to our webhook.
export async function POST(request: Request) {
  if (!(await hookAuthorized(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { company_id } = await request.json().catch(() => ({}));
  if (typeof company_id !== "string") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const keys = await companyKeys(company_id);
  if (!keys) return NextResponse.json({ skipped: true });
  const admin = createAdminClient();
  try {
    await lalamove(keys, "GET", "/v3/cities");
    await lalamove(keys, "PATCH", "/v3/webhook", { url: `${new URL(request.url).origin}/api/delivery/lalamove` });
    await admin.from("company_lalamove").update({ status: "connected", error: null }).eq("company_id", company_id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = (e as Error).message;
    await admin
      .from("company_lalamove")
      .update({ status: "error", error: /unauthor|signature|401/i.test(message) ? "Lalamove didn't accept these keys." : message.slice(0, 200) })
      .eq("company_id", company_id);
    return NextResponse.json({ ok: false, error: message });
  }
}
