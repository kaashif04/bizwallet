"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";
import type { OrderStatus, OwnerOrder } from "@/lib/admin/owner-types";

const SYM = currencySymbol("MYR");

const STATUS_META: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
  preparing: { label: "Preparing", cls: "bg-blue-100 text-blue-700" },
  ready: { label: "Ready", cls: "bg-emerald-100 text-emerald-700" },
  completed: { label: "Completed", cls: "bg-slate-100 text-slate-500" },
  cancelled: { label: "Cancelled", cls: "bg-rose-100 text-rose-600" },
};

type Filter = "active" | OrderStatus;
const FILTERS: Filter[] = [
  "active",
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapOrder(o: any): OwnerOrder {
  return {
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    items: Array.isArray(o.items) ? o.items : [],
    total: Number(o.total),
    createdAt: o.created_at,
    notes: o.notes,
    paymentMethod: o.payment_method,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Read-only monitor. The physical POS is the source of truth for order status;
// this view just reflects it live (no in-app status controls).
export default function LiveOrders({
  outletId,
  initial,
}: {
  outletId: string;
  initial: OwnerOrder[];
}) {
  const [supabase] = useState(() => createClient());
  const [orders, setOrders] = useState<OwnerOrder[]>(initial);
  const [filter, setFilter] = useState<Filter>("active");
  const [live, setLive] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("id,order_number,status,items,total,created_at,notes,payment_method")
      .eq("outlet_id", outletId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setOrders(data.map(mapOrder));
  }, [supabase, outletId]);

  // Realtime: the POS updates order status -> this board updates instantly.
  useEffect(() => {
    const channel = supabase
      .channel(`orders-${outletId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `outlet_id=eq.${outletId}`,
        },
        () => refresh()
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, outletId, refresh]);

  const visible = orders.filter((o) =>
    filter === "active"
      ? ["pending", "preparing", "ready"].includes(o.status)
      : o.status === filter
  );

  return (
    <div>
      <p className="mb-3 text-xs text-slate-400">
        Live view — order status is controlled by your in-store POS.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition ${
              filter === f
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 text-xs font-medium ${
              live ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                live ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
            {live ? "Live" : "Offline"}
          </span>
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
          No {filter === "active" ? "active" : filter} orders.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: OwnerOrder }) {
  const meta = STATUS_META[order.status];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Order #{order.orderNumber}</p>
          <p className="text-xs text-slate-400" suppressHydrationWarning>
            {new Date(order.createdAt).toLocaleTimeString("en-MY", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {order.paymentMethod ? ` · ${order.paymentMethod}` : ""}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
          {meta.label}
        </span>
      </div>

      <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
        {order.items.length === 0 ? (
          <li className="text-slate-400">No item details</li>
        ) : (
          order.items.map((it, i) => (
            <li key={i}>
              {(it.quantity ?? it.qty ?? 1)} × {it.name ?? "Item"}
            </li>
          ))
        )}
      </ul>

      <div className="mt-3 border-t border-slate-100 pt-3 text-sm font-bold text-slate-900">
        {SYM}
        {order.total.toFixed(2)}
      </div>
    </div>
  );
}
