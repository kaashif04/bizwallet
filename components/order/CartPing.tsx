"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "./cart-context";

// Tells the restaurant what this phone has in its cart (wallet_cart_ping), so BizPos
// can show scans and carts nobody ordered. Dish ids and counts only; nothing personal.
// A cart that empties (ordered, or cleared) starts a new one next time.
export default function CartPing({ token }: { token: string }) {
  const { lines } = useCart();
  const [supabase] = useState(() => createClient());
  const idKey = `bw_cart_id:t:${token}`;
  const cartId = useRef<string | null>(null);
  const had = useRef(false);
  const scanned = useRef(false);

  useEffect(() => {
    let id: string | null = null;
    try {
      id = sessionStorage.getItem(idKey);
    } catch {}
    if (!id) {
      id = crypto.randomUUID();
      try {
        sessionStorage.setItem(idKey, id);
      } catch {}
    }
    cartId.current = id;
  }, [idKey]);

  useEffect(() => {
    if (!lines.length) {
      if (had.current) {
        // Ordered or emptied: the next cart is a new one.
        had.current = false;
        cartId.current = crypto.randomUUID();
        try {
          sessionStorage.setItem(idKey, cartId.current);
        } catch {}
        return;
      }
      // The scan itself, once per page load (a restored cart cancels it and pings with its items).
      if (scanned.current) return;
      scanned.current = true;
      const t = setTimeout(() => cartId.current && supabase.rpc("wallet_cart_ping", { p_token: token, p_cart: cartId.current }).then(() => {}), 1500);
      return () => clearTimeout(t);
    }
    had.current = true;
    const items = lines.map((l) => ({ id: l.item.comboOf ?? l.item.id, qty: l.quantity }));
    const t = setTimeout(() => cartId.current && supabase.rpc("wallet_cart_ping", { p_token: token, p_cart: cartId.current, p_items: items }).then(() => {}), 2000);
    return () => clearTimeout(t);
  }, [lines, token, idKey, supabase]);

  return null;
}
