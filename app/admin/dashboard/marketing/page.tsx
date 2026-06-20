import { createAdminClient } from "@/lib/supabase/admin";
import BroadcastForm from "@/components/admin/portal/BroadcastForm";
import CampaignsTable from "@/components/admin/portal/CampaignsTable";
import type { Campaign } from "@/lib/admin/portal-types";

export default async function MarketingPage() {
  let campaigns: Campaign[] = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("marketing_campaigns")
      .select("id, title, message, audience, recipient_count, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    campaigns = (data ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      message: c.message,
      audience: c.audience,
      recipientCount: c.recipient_count,
      createdAt: c.created_at,
    }));
  } catch {
    campaigns = [];
  }

  return (
    <div>
      <header>
        <p className="text-sm font-medium text-brand-600">Marketing</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Broadcasts</h1>
        <p className="mt-1 text-sm text-slate-500">
          Send a promotional push straight to customers&rsquo; notification bells.
        </p>
      </header>

      <div className="mt-5">
        <BroadcastForm />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">
          Recent campaigns ({campaigns.length})
        </h2>
        <CampaignsTable rows={campaigns} />
      </section>
    </div>
  );
}
