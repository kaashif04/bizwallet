"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { MenuItem, Outlet } from "@/lib/order-types";
import { useCart } from "./cart-context";
import OutletSelect from "./OutletSelect";
import MenuView from "./MenuView";
import AddToCartSheet from "./AddToCartSheet";
import ViewCartBar from "./ViewCartBar";
import CheckoutScreen from "./CheckoutScreen";
import OrderConfirmation from "./OrderConfirmation";

type Step = "outlet" | "menu" | "checkout" | "done";
type Method = "wallet" | "gateway";

const stepVariants: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};
const stepTransition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

export default function OrderExperience({
  outlets,
  menuByOutlet,
  walletBalance: initialWalletBalance,
  currency,
  userId,
}: {
  outlets: Outlet[];
  menuByOutlet: Record<string, MenuItem[]>;
  walletBalance: number;
  currency: string;
  userId: string | null;
}) {
  const cart = useCart();
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState(initialWalletBalance);
  const [step, setStep] = useState<Step>("outlet");
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const [placed, setPlaced] = useState<{
    ticketId?: string;
    orderId?: string;
    method: Method;
    total: number;
    pointsEarned?: number;
  } | null>(null);

  function chooseOutlet(o: Outlet) {
    if (outlet && o.id !== outlet.id) cart.clear(); // switching outlet resets cart
    setOutlet(o);
    setStep("menu");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-rose-50/30">
      <AnimatePresence mode="wait">
        {step === "outlet" && (
          <motion.div
            key="outlet"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={stepTransition}
          >
            <OutletSelect outlets={outlets} onSelect={chooseOutlet} />
          </motion.div>
        )}

        {step === "menu" && outlet && (
          <motion.div
            key="menu"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={stepTransition}
          >
            <MenuView
              outlet={outlet}
              items={menuByOutlet[outlet.id] ?? []}
              currency={currency}
              onChangeOutlet={() => setStep("outlet")}
              onItemClick={setSheetItem}
            />
          </motion.div>
        )}

        {step === "checkout" && outlet && (
          <motion.div
            key="checkout"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={stepTransition}
          >
            <CheckoutScreen
              outlet={outlet}
              currency={currency}
              walletBalance={walletBalance}
              userId={userId}
              onBack={() => setStep("menu")}
              onPlaced={(r) => {
                setPlaced({
                  ticketId: r.ticketId,
                  orderId: r.orderId,
                  method: r.method,
                  total: r.total,
                  pointsEarned: r.pointsEarned,
                });
                if (r.walletBalance != null) {
                  setWalletBalance(r.walletBalance);
                  // Real order placed -> refresh cached pages (dashboard/wallet).
                  router.refresh();
                }
                cart.clear();
                setStep("done");
              }}
            />
          </motion.div>
        )}

        {step === "done" && outlet && placed && (
          <motion.div
            key="done"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={stepTransition}
          >
            <OrderConfirmation
              outlet={outlet}
              currency={currency}
              ticketId={placed.ticketId}
              orderId={placed.orderId}
              total={placed.total}
              pointsEarned={placed.pointsEarned}
              onDone={() => {
                setPlaced(null);
                setStep("menu");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays relevant only while browsing the menu */}
      {step === "menu" && (
        <ViewCartBar currency={currency} onClick={() => setStep("checkout")} />
      )}
      <AnimatePresence>
        {sheetItem && step === "menu" && (
          <AddToCartSheet
            key="sheet"
            item={sheetItem}
            currency={currency}
            onClose={() => setSheetItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
