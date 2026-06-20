import { createAdminClient } from "@/lib/supabase/admin";
import PromoCodeForm from "@/components/admin/portal/PromoCodeForm";
import PromoCodesTable from "@/components/admin/portal/PromoCodesTable";
import type { PromoCode } from "@/lib/admin/portal-types";

export default async function VouchersPage() {
  let codes: PromoCode[] = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("promo_codes")
      .select(
        "id, code, discount_type, discount_value, usage_limit, times_used, expires_at, is_active, created_at"
      )
      .order("created_at", { ascending: false });

    codes = (data ?? []).map((c) => ({
      id: c.id,
      code: c.code,
      discountType: c.discount_type,
      discountValue: Number(c.discount_value),
      usageLimit: c.usage_limit,
      timesUsed: c.times_used,
      expiresAt: c.expires_at,
      isActive: c.is_active,
      createdAt: c.created_at,
    }));
  } catch {
    codes = [];
  }

  return (
    <div>
      <header>
        <p className="text-sm font-medium text-brand-600">Vouchers</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Promo Code Engine</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate and manage discount codes customers can redeem at checkout.
        </p>
      </header>

      <div className="mt-5">
        <PromoCodeForm />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">
          All codes ({codes.length})
        </h2>
        <PromoCodesTable rows={codes} />
      </section>
    </div>
  );
}
