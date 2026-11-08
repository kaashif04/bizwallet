"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { CartLine, MenuItem, VariantSelection } from "@/lib/order-types";
import { lineTotals } from "@/lib/free-items";

type State = { lines: CartLine[] };

type Action =
  | { type: "add"; item: MenuItem; quantity: number; selections: VariantSelection[] }
  | { type: "inc"; lineId: string }
  | { type: "dec"; lineId: string }
  | { type: "remove"; lineId: string }
  | { type: "clear" }
  | { type: "load"; lines: CartLine[] };

function signature(itemId: string, selections: VariantSelection[]): string {
  return (
    itemId +
    "|" +
    selections
      .map((s) => s.modifierId)
      .sort()
      .join(",")
  );
}

function unitPriceOf(item: MenuItem, selections: VariantSelection[]): number {
  return item.price + selections.reduce((s, v) => s + (v.priceDelta || 0), 0);
}

function newLineId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add": {
      const key = signature(action.item.id, action.selections);
      // Merge identical item + variant combos into one line.
      const existing = state.lines.find(
        (l) => signature(l.item.id, l.selections) === key
      );
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l === existing ? { ...l, quantity: l.quantity + action.quantity } : l
          ),
        };
      }
      const line: CartLine = {
        lineId: newLineId(),
        item: action.item,
        quantity: action.quantity,
        selections: action.selections,
        unitPrice: unitPriceOf(action.item, action.selections),
      };
      return { lines: [...state.lines, line] };
    }
    case "inc":
      return {
        lines: state.lines.map((l) =>
          l.lineId === action.lineId ? { ...l, quantity: l.quantity + 1 } : l
        ),
      };
    case "dec":
      return {
        lines: state.lines.flatMap((l) =>
          l.lineId === action.lineId
            ? l.quantity > 1
              ? [{ ...l, quantity: l.quantity - 1 }]
              : []
            : [l]
        ),
      };
    case "remove":
      return { lines: state.lines.filter((l) => l.lineId !== action.lineId) };
    case "clear":
      return { lines: [] };
    case "load":
      return { lines: action.lines };
  }
}

type CartValue = {
  lines: CartLine[];
  totalItems: number;
  totalPrice: number;
  lineTotal: (lineId: string) => number; // after free-with-spend items
  add: (item: MenuItem, quantity: number, selections: VariantSelection[]) => void;
  inc: (lineId: string) => void;
  dec: (lineId: string) => void;
  remove: (lineId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

// storageKey: keep the cart in this tab's sessionStorage, so a reload, or the phone
// dropping the tab while the guest is in another app, doesn't empty it. (Not for the kiosk.)
export function CartProvider({ children, storageKey }: { children: React.ReactNode; storageKey?: string }) {
  const [state, dispatch] = useReducer(reducer, { lines: [] });
  const restored = useRef(false);
  useEffect(() => {
    if (!storageKey) return;
    try {
      const lines = JSON.parse(sessionStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(lines) && lines.length) dispatch({ type: "load", lines });
    } catch {
      // Blocked or corrupt storage: start empty.
    }
    restored.current = true;
  }, [storageKey]);
  useEffect(() => {
    if (!storageKey || !restored.current) return;
    try {
      if (state.lines.length) sessionStorage.setItem(storageKey, JSON.stringify(state.lines));
      else sessionStorage.removeItem(storageKey);
    } catch {
      // Storage full or blocked: the cart still works, it just won't survive a reload.
    }
  }, [storageKey, state.lines]);

  const add = useCallback(
    (item: MenuItem, quantity: number, selections: VariantSelection[]) =>
      dispatch({ type: "add", item, quantity, selections }),
    []
  );
  const inc = useCallback((lineId: string) => dispatch({ type: "inc", lineId }), []);
  const dec = useCallback((lineId: string) => dispatch({ type: "dec", lineId }), []);
  const remove = useCallback(
    (lineId: string) => dispatch({ type: "remove", lineId }),
    []
  );
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const totalItems = state.lines.reduce((n, l) => n + l.quantity, 0);
  const value = useMemo<CartValue>(() => {
    const totals = lineTotals(state.lines);
    return {
      lines: state.lines,
      totalItems,
      totalPrice: Array.from(totals.values()).reduce((s, n) => s + n, 0),
      lineTotal: (lineId: string) => totals.get(lineId) ?? 0,
      add,
      inc,
      dec,
      remove,
      clear,
    };
  }, [state.lines, totalItems, add, inc, dec, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
