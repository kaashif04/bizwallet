"use client";

import { useState } from "react";
import type { Outlet, ServiceType } from "@/lib/order-types";
import { currencySymbol } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "./cart-context";
import { buildOrderPayload, dispatchOrderToPOS } from "@/lib/pos";

type Method = "wallet" | "gateway";

export default function CheckoutScreen({
  outlet,
  currency,
  walletBalance,
  userId,
  onBack,
  onPlaced,
}: {
  outlet: Outlet;
  currency: string;
  walletBalance: number;
  userId: string | null;
  onBack: () => void;
  onPlaced: (r: {
    ticketId?: string;
    orderId?: string;
    method: Method;
    total: number;
    pointsEarned?: number;
    walletBalance?: number;
  }) => void;
}) {
  const cart = useCart();
  const sym = currencySymbol(currency);
  const [method, setMethod] = useState<Method>("wallet");
  const [serviceType, setServiceType] = useState<ServiceType>("takeaway");
  const [tableNumber, setTableNumber] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function scanTable() {
    // Mock QR scan — a real table QR encodes the outlet_id + table number.
    setTableNumber(String(Math.floor(Math.random() * 20) + 1));
  }

  const total = cart.totalPrice;
  const insufficient = method === "wallet" && total > walletBalance;

  async function placeOrder() {
    setError(null);
    if (cart.lines.length === 0) return;
    if (serviceType === "dine_in" && !tableNumber.trim()) {
      setError("Scan or enter your table number for dine-in.");
      return;
    }
    if (method === "wallet" && insufficient) {
      setError("Not enough store credit. Top up or pay via the gateway.");
      return;
    }
    setPlacing(true);

    const payload = buildOrderPayload(outlet, cart.lines, method, {
      type: serviceType,
      table: serviceType === "dine_in" ? tableNumber.trim() : null,
    });
    const isRealOutlet = !outlet.id.startsWith("demo-");

    // Real wallet checkout: process_wallet_payment atomically deducts credit,
    // creates the order, writes the ledger and awards loyalty points.
    if (method === "wallet" && userId && isRealOutlet) {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("process_wallet_payment", {
        p_user_id: userId,
        p_order_total: payload.total,
        p_outlet_id: outlet.id,
        p_items: payload.items,
        p_notes: null,
        p_order_type: payload.type,
        p_table_number: payload.table,
      });

      if (error) {
        setPlacing(false);
        setError(
          error.message.toLowerCase().includes("insufficient")
            ? "Not enough store credit — top up or pay via the gateway."
            : error.message
        );
        return;
      }

      await dispatchOrderToPOS(outlet, payload); // notify the outlet's POS (stub)
      setPlacing(false);
      onPlaced({
        ticketId: data?.order_number ? `#${data.order_number}` : undefined,
        orderId: data?.order_id ?? undefined,
        method,
        total: payload.total,
        pointsEarned: data?.points_earned ?? undefined,
        walletBalance:
          data?.wallet_balance != null ? Number(data.wallet_balance) : undefined,
      });
      return;
    }

    // Demo outlet, or gateway (payment provider not integrated yet) -> simulate.
    const pos = await dispatchOrderToPOS(outlet, payload);
    await new Promise((r) => setTimeout(r, 700));
    setPlacing(false);
    onPlaced({ ticketId: pos.ticketId, method, total: payload.total });
  }

  return (
    <div className="mx-auto max-w-md px-5 pb-40 pt-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
          aria-label="Back to menu"
        >
          <span className="text-lg">←</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900">Checkout</h1>
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
        {outlet.kind ?? "Outlet"}
      </p>
      <p className="text-sm font-semibold text-slate-900">{outlet.name}</p>

      {/* Cart lines */}
      <div className="mt-4 space-y-3">
        {cart.lines.map((l) => (
          <div
            key={l.lineId}
            className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-2xl">
              {l.item.emoji ?? "🍽️"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {l.item.name}
              </p>
              {l.selections.length > 0 && (
                <p className="truncate text-xs text-slate-500">
                  {l.selections.map((s) => s.option).join(" · ")}
                </p>
              )}
              <p className="mt-0.5 text-sm font-semibold text-brand-700">
                {sym}
                {(l.unitPrice * l.quantity).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2 self-center">
              <button
                type="button"
                onClick={() => cart.dec(l.lineId)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-700"
                aria-label="Decrease"
              >
                −
              </button>
              <span className="w-5 text-center text-sm font-semibold">
                {l.quantity}
              </span>
              <button
                type="button"
                onClick={() => cart.inc(l.lineId)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-700"
                aria-label="Increase"
              >
                +
              </button>
            </div>
          </div>
        ))}
        {cart.lines.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            Your cart is empty.
          </p>
        )}
      </div>

      {/* Service type */}
      <h2 className="mt-7 text-sm font-semibold text-slate-900">Service</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["dine_in", "takeaway"] as ServiceType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setServiceType(t)}
            className={`rounded-2xl border p-3 text-center text-sm font-semibold transition ${
              serviceType === t
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {t === "dine_in" ? "🍽️ Dine-In" : "🥡 Takeaway"}
          </button>
        ))}
      </div>

      {serviceType === "dine_in" && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={scanTable}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              📷 Scan table QR
            </button>
            <span className="text-xs text-slate-500">or enter it manually</span>
          </div>
          <input
            value={tableNumber}
            onChange={(e) =>
              setTableNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ""))
            }
            placeholder="Table number"
            inputMode="numeric"
            className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
          />
          {tableNumber && (
            <p className="mt-2 text-sm font-medium text-slate-700">
              Table {tableNumber}
            </p>
          )}
        </div>
      )}

      {/* Payment method */}
      <h2 className="mt-7 text-sm font-semibold text-slate-900">Payment method</h2>
      <div className="mt-3 space-y-3">
        <PaymentOption
          active={method === "wallet"}
          onClick={() => setMethod("wallet")}
          emoji="👛"
          title="Pay via Store Credit"
          subtitle={`Wallet balance ${sym}${walletBalance.toFixed(2)}`}
          warn={insufficient ? "Insufficient balance" : undefined}
        />
        <PaymentOption
          active={method === "gateway"}
          onClick={() => setMethod("gateway")}
          emoji="💳"
          title="Pay via Payment Gateway"
          subtitle="FPX / Credit or Debit Card"
        />
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Summary + place order */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>
            {sym}
            {total.toFixed(2)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-base font-bold text-slate-900">
          <span>Total</span>
          <span>
            {sym}
            {total.toFixed(2)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={placeOrder}
        disabled={placing || cart.lines.length === 0}
        className="mt-5 flex w-full items-center justify-center rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition active:scale-[0.99] disabled:opacity-60"
      >
        {placing ? "Placing order…" : `Place order · ${sym}${total.toFixed(2)}`}
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">
        Your order is sent to {outlet.name}&apos;s kitchen (POS).
      </p>
    </div>
  );
}

function PaymentOption({
  active,
  onClick,
  emoji,
  title,
  subtitle,
  warn,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  title: string;
  subtitle: string;
  warn?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
        active ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white"
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className={`block text-xs ${warn ? "text-red-600" : "text-slate-500"}`}>
          {warn ?? subtitle}
        </span>
      </span>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
          active ? "border-brand-600" : "border-slate-300"
        }`}
      >
        {active && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
      </span>
    </button>
  );
}
