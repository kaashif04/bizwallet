import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/customer/BottomNav";
import { PageHeader, screen } from "@/components/customer/ui";
import ProfileView, { type ProfileData } from "@/components/customer/ProfileView";
import { storeNames, type Place } from "@/lib/places";

const DEMO: ProfileData = {
  name: "Aisyah",
  email: "aisyah@example.com",
  phone: "+60 12-345 6789",
  avatarUrl: null,
  emailVerified: true,
  phoneVerified: false,
  places: [],
  memberSince: "June 2026",
  dateOfBirth: null,
  gender: null,
  dietaryPreferences: [],
  address: null,
  marketingConsent: null,
};

export default async function ProfilePage() {
  let data: ProfileData = DEMO;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const [{ data: profile }, { data: placeData }] = await Promise.all([
        supabase
          .from("members")
          .select(
            "full_name,email,phone,avatar_url,email_verified,phone_verified,created_at,date_of_birth,gender,dietary_preferences,address,marketing_consent"
          )
          .eq("id", user.id)
          .single(),
        supabase.rpc("wallet_my_places"),
      ]);
      data = {
        name: profile?.full_name ?? user.email?.split("@")[0] ?? "There",
        email: profile?.email ?? user.email ?? "",
        phone: profile?.phone ?? user.phone ?? "",
        avatarUrl: profile?.avatar_url ?? null,
        emailVerified: profile?.email_verified ?? Boolean(user.email_confirmed_at),
        phoneVerified: profile?.phone_verified ?? false,
        places: ((placeData ?? []) as Place[]).map((p) => ({
          companyId: p.company_id,
          company: storeNames(p.branches.map((b) => b.name), p.company),
          consent: p.marketing_consent,
        })),
        memberSince: profile?.created_at
          ? new Date(profile.created_at).toLocaleDateString("en-MY", {
              timeZone: "Asia/Kuala_Lumpur",
              month: "long",
              year: "numeric",
            })
          : "",
        dateOfBirth: profile?.date_of_birth ?? null,
        gender: profile?.gender ?? null,
        dietaryPreferences: profile?.dietary_preferences ?? [],
        address: profile?.address ?? null,
        marketingConsent: profile?.marketing_consent ?? null,
      };
    }
  } catch {
    // Supabase not configured / unreachable -> demo data.
  }

  return (
    <div className="min-h-dvh bg-ink-50">
      <div className={screen}>
        <PageHeader title="Profile" />

        <ProfileView data={data} />
      </div>

      <BottomNav />
    </div>
  );
}
