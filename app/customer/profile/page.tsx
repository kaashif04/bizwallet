import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/customer/BottomNav";
import ProfileView, { type ProfileData } from "@/components/customer/ProfileView";
import { computeTierProgress } from "@/lib/loyalty";
import { DEMO_TIERS } from "@/lib/dashboard-demo";

const DEMO: ProfileData = {
  name: "Aisyah",
  email: "aisyah@example.com",
  phone: "+60 12-345 6789",
  role: "customer",
  avatarUrl: null,
  emailVerified: true,
  phoneVerified: false,
  points: 350,
  tier: "Silver",
  memberSince: "June 2026",
};

export default async function ProfilePage() {
  let data: ProfileData = DEMO;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const [{ data: profile }, { data: loyalty }, { data: tierRows }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "full_name,email,phone,role,avatar_url,email_verified,phone_verified,created_at"
          )
          .eq("id", user.id)
          .single(),
        supabase
          .from("loyalty_accounts")
          .select("points_balance, points_earned")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("loyalty_tiers")
          .select("id,name,points_required,discount_percentage,theme_color")
          .order("points_required"),
      ]);

      const points = loyalty?.points_balance ?? 0;
      const lifetimePoints = loyalty?.points_earned ?? 0;
      const tiers = tierRows && tierRows.length > 0
        ? tierRows.map((t) => ({
            id: t.id,
            name: t.name,
            points_required: t.points_required,
            discount_percentage: Number(t.discount_percentage),
            theme_color: t.theme_color,
          }))
        : DEMO_TIERS;
      data = {
        name: profile?.full_name ?? user.email?.split("@")[0] ?? "There",
        email: profile?.email ?? user.email ?? "",
        phone: profile?.phone ?? user.phone ?? "",
        role: profile?.role ?? "customer",
        avatarUrl: profile?.avatar_url ?? null,
        emailVerified: profile?.email_verified ?? Boolean(user.email_confirmed_at),
        phoneVerified: profile?.phone_verified ?? false,
        points,
        tier: computeTierProgress(tiers, lifetimePoints).current,
        memberSince: profile?.created_at
          ? new Date(profile.created_at).toLocaleDateString("en-MY", {
              month: "long",
              year: "numeric",
            })
          : "",
      };
    }
  } catch {
    // Supabase not configured / unreachable -> demo data.
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-rose-50/40">
      <div className="mx-auto max-w-md px-5 pb-28 pt-6">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          <p className="text-sm text-slate-500">Your account &amp; membership</p>
        </header>

        <ProfileView data={data} />
      </div>

      <BottomNav />
    </div>
  );
}
