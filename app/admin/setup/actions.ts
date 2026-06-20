"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, isSuperAdminEmail } from "@/lib/admin/auth";
import type { SetupState } from "./types";

// Creates an outlet and assigns a manager as its owner.
// Signature matches useFormState: (prevState, formData) => newState.
export async function createOutletAction(
  _prev: SetupState,
  formData: FormData
): Promise<SetupState> {
  // Re-verify Super Admin server-side — never trust the client.
  const user = await getCurrentUser();
  if (!user || !isSuperAdminEmail(user.email)) {
    return { status: "error", message: "Not authorized — Super Admin only." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!name) return { status: "error", message: "Outlet name is required." };
  if (!email || !email.includes("@")) {
    return { status: "error", message: "A valid manager email is required." };
  }

  // Service-role client: bypasses RLS so we can look up any user, change their
  // role, and create an outlet owned by them.
  const admin = createAdminClient();

  // 1. Does an account with this email exist? (profiles mirrors the auth email.)
  const { data: profile, error: lookupErr } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .ilike("email", email)
    .maybeSingle();

  if (lookupErr) return { status: "error", message: lookupErr.message };
  if (!profile) {
    return {
      status: "error",
      message: `No account found for ${email}. Ask them to sign up first, then assign them.`,
    };
  }

  // 2. Promote to owner (idempotent — skip if already an owner).
  if (profile.role !== "owner") {
    const { error: roleErr } = await admin
      .from("profiles")
      .update({ role: "owner" })
      .eq("id", profile.id);
    if (roleErr) return { status: "error", message: roleErr.message };
  }

  // 3. Create the outlet, owned by this user.
  const { error: outletErr } = await admin.from("outlets").insert({
    name,
    address: location || null,
    owner_id: profile.id,
    is_active: true,
  });
  if (outletErr) return { status: "error", message: outletErr.message };

  revalidatePath("/admin/setup");
  return {
    status: "success",
    message: `"${name}" created — ${profile.full_name ?? email} is now its owner.`,
  };
}
