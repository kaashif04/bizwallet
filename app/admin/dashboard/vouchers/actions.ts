"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PromoCodeState } from "@/lib/admin/portal-types";

async function requireOwner() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("members")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "owner" ? user : null;
}

// Signature matches useFormState: (prevState, formData) => newState.
export async function createPromoCodeAction(
  _prev: PromoCodeState,
  formData: FormData
): Promise<PromoCodeState> {
  const user = await requireOwner();
  if (!user) return { status: "error", message: "Not authorized — owners only." };

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const discountType = String(formData.get("discountType") ?? "");
  const discountValueRaw = String(formData.get("discountValue") ?? "");
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();
  const usageLimitRaw = String(formData.get("usageLimit") ?? "").trim();

  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    return {
      status: "error",
      message: "Code must be 3-32 characters: letters, numbers, dashes, underscores.",
    };
  }
  if (discountType !== "percentage" && discountType !== "fixed") {
    return { status: "error", message: "Pick a discount type." };
  }
  const discountValue = Number(discountValueRaw);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { status: "error", message: "Discount value must be greater than zero." };
  }
  if (discountType === "percentage" && discountValue > 100) {
    return { status: "error", message: "Percentage discount can't exceed 100%." };
  }

  let usageLimit: number | null = null;
  if (usageLimitRaw) {
    usageLimit = Number(usageLimitRaw);
    if (!Number.isInteger(usageLimit) || usageLimit <= 0) {
      return { status: "error", message: "Usage limit must be a positive whole number." };
    }
  }

  let expiresAt: string | null = null;
  if (expiresAtRaw) {
    const d = new Date(expiresAtRaw);
    if (Number.isNaN(d.getTime())) {
      return { status: "error", message: "Invalid expiry date." };
    }
    if (d.getTime() <= Date.now()) {
      return { status: "error", message: "Expiry date must be in the future." };
    }
    expiresAt = d.toISOString();
  }

  const admin = createAdminClient();
  const { error } = await admin.from("promo_codes").insert({
    code,
    discount_type: discountType,
    discount_value: discountValue,
    usage_limit: usageLimit,
    expires_at: expiresAt,
    created_by: user.id,
  });

  if (error) {
    const message = error.code === "23505" ? `Code "${code}" already exists.` : error.message;
    return { status: "error", message };
  }

  revalidatePath("/admin/dashboard/vouchers");
  return { status: "success", message: `Code "${code}" created.` };
}

export async function togglePromoCodeAction(formData: FormData) {
  const user = await requireOwner();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  const nextActive = formData.get("nextActive") === "true";
  if (!id) return;

  const admin = createAdminClient();
  await admin.from("promo_codes").update({ is_active: nextActive }).eq("id", id);

  revalidatePath("/admin/dashboard/vouchers");
}
