"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, isSuperAdminEmail } from "@/lib/admin/auth";
import type { SetupState } from "./types";

// Promotes a BizWallet member to owner (access to the CRM portal). Outlets
// themselves live in BizPos now.
// Signature matches useFormState: (prevState, formData) => newState.
export async function promoteOwnerAction(
  _prev: SetupState,
  formData: FormData
): Promise<SetupState> {
  // Re-verify Super Admin server-side — never trust the client.
  const user = await getCurrentUser();
  if (!user || !isSuperAdminEmail(user.email)) {
    return { status: "error", message: "Not authorized — Super Admin only." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { status: "error", message: "A valid email is required." };
  }

  // Service-role client: bypasses RLS so we can look up any member and change
  // their role (the members trigger blocks role changes from end users).
  const admin = createAdminClient();

  const { data: member, error: lookupErr } = await admin
    .from("members")
    .select("id, full_name, role")
    .ilike("email", email)
    .maybeSingle();

  if (lookupErr) return { status: "error", message: lookupErr.message };
  if (!member) {
    return {
      status: "error",
      message: `No BizWallet account found for ${email}. Ask them to sign up first.`,
    };
  }
  if (member.role === "owner") {
    return { status: "success", message: `${member.full_name ?? email} is already an owner.` };
  }

  const { error: roleErr } = await admin
    .from("members")
    .update({ role: "owner" })
    .eq("id", member.id);
  if (roleErr) return { status: "error", message: roleErr.message };

  revalidatePath("/admin/setup");
  return { status: "success", message: `${member.full_name ?? email} is now an owner.` };
}
