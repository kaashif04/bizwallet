"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BroadcastState } from "@/lib/admin/portal-types";

// Signature matches useFormState: (prevState, formData) => newState.
export async function sendBroadcastAction(
  _prev: BroadcastState,
  formData: FormData
): Promise<BroadcastState> {
  // Re-verify the caller is an owner server-side — never trust the client.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const { data: profile } = await supabase
    .from("members")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "owner") {
    return { status: "error", message: "Not authorized — owners only." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const audience = String(formData.get("audience") ?? "");

  if (!title) return { status: "error", message: "Title is required." };
  if (!message) return { status: "error", message: "Message is required." };
  if (!["all", "high_points", "inactive_30d"].includes(audience)) {
    return { status: "error", message: "Pick a target audience." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("admin_send_broadcast", {
    p_title: title,
    p_message: message,
    p_audience: audience,
    p_created_by: user.id,
  });
  if (error) return { status: "error", message: error.message };

  revalidatePath("/admin/dashboard/marketing");
  return {
    status: "success",
    message: `Sent to ${data.recipient_count} customer${data.recipient_count === 1 ? "" : "s"}.`,
  };
}
