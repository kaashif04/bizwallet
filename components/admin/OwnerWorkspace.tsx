"use client";

import { useState } from "react";
import LiveOrders from "./LiveOrders";
import MenuManager from "./MenuManager";
import type { OwnerMenuItem, OwnerOrder } from "@/lib/admin/owner-types";

type Tab = "orders" | "menu";

export default function OwnerWorkspace({
  outletId,
  initialMenu,
  initialOrders,
}: {
  outletId: string;
  initialMenu: OwnerMenuItem[];
  initialOrders: OwnerOrder[];
}) {
  const [tab, setTab] = useState<Tab>("orders");

  return (
    <div className="mt-6">
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>
          Live orders
        </TabButton>
        <TabButton active={tab === "menu"} onClick={() => setTab("menu")}>
          Menu &amp; inventory
        </TabButton>
      </div>

      <div className="mt-5">
        {tab === "orders" ? (
          <LiveOrders outletId={outletId} initial={initialOrders} />
        ) : (
          <MenuManager outletId={outletId} initial={initialMenu} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-brand-600 text-white" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}
