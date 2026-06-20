import { createClient } from "@/lib/supabase/server";
import WalletExperience from "@/components/wallet/WalletExperience";
import BottomNav from "@/components/customer/BottomNav";
import { DEMO_TXNS } from "@/lib/wallet-demo";
import type { WalletTxn } from "@/lib/wallet-types";

export default async function WalletPage() {
  let balance = 128.5;
  let currency = "MYR";
  let txns: WalletTxn[] = DEMO_TXNS;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const [{ data: wallet }, { data: rows }] = await Promise.all([
        supabase
          .from("wallets")
          .select("balance,currency")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("wallet_transactions")
          .select("id,type,amount,balance_after,description,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (wallet) {
        balance = Number(wallet.balance);
        currency = wallet.currency;
      }
      if (rows) {
        txns = rows.map((r) => ({
          id: r.id,
          type: r.type,
          amount: Number(r.amount),
          balanceAfter: Number(r.balance_after),
          description: r.description,
          createdAt: r.created_at,
        }));
      }
    }
  } catch {
    // Supabase not configured / unreachable -> demo data.
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-rose-50/40">
      <div className="mx-auto max-w-md px-5 pb-28 pt-6">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">My Wallet</h1>
          <p className="text-sm text-slate-500">Manage your store credit</p>
        </header>

        <WalletExperience
          initialBalance={balance}
          currency={currency}
          initialTxns={txns}
        />
      </div>

      <BottomNav />
    </div>
  );
}
