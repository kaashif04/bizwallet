import { createClient } from "@/lib/supabase/server";
import WalletExperience from "@/components/wallet/WalletExperience";
import BottomNav from "@/components/customer/BottomNav";
import { PageHeader, screen } from "@/components/customer/ui";
import type { WalletTxn } from "@/lib/wallet-types";
import { billplzEnabled } from "@/lib/billplz";

export default async function WalletPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: wallet }, { data: rows }] = await Promise.all([
    supabase.from("wallets").select("balance,currency").eq("user_id", user!.id).maybeSingle(),
    supabase
      .from("wallet_transactions")
      .select("id,type,amount,balance_after,description,created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const txns: WalletTxn[] = (rows ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    balanceAfter: Number(r.balance_after),
    description: r.description,
    createdAt: r.created_at,
  }));

  return (
    <div className="min-h-dvh bg-ink-50">
      <div className={screen}>
        <PageHeader title="Wallet" subtitle="Your credit and its history" />

        <WalletExperience
          initialBalance={Number(wallet?.balance ?? 0)}
          currency={wallet?.currency ?? "MYR"}
          initialTxns={txns}
          topUpEnabled={billplzEnabled()}
          // Off until the POS has its Wallet button (BizPos), then WALLET_COUNTER_PAY=1.
          counterPay={process.env.WALLET_COUNTER_PAY === "1"}
        />
      </div>

      <BottomNav />
    </div>
  );
}
