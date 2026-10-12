import { createClient } from "@/lib/supabase/server";
import WalletExperience from "@/components/wallet/WalletExperience";
import BottomNav from "@/components/customer/BottomNav";
import { topUpEnabled, type WalletTxn } from "@/lib/wallet-types";

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
      <div className="mx-auto max-w-md px-5 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="mb-5">
          <h1 className="text-[2rem] font-semibold text-slate-900">Wallet</h1>
          <p className="text-sm text-slate-500">Your store credit and history</p>
        </header>

        <WalletExperience
          initialBalance={Number(wallet?.balance ?? 0)}
          currency={wallet?.currency ?? "MYR"}
          initialTxns={txns}
          topUpEnabled={topUpEnabled()}
        />
      </div>

      <BottomNav />
    </div>
  );
}
