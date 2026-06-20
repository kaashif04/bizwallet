"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import type { CartLine, MenuItem, VariantSelection } from "@/lib/order-types";

type State = { lines: CartLine[] };

type Action =
  | { type: "add"; item: MenuItem; quantity: number; selections: VariantSelection[] }
  | { type: "inc"; lineId: string }
  | { type: "dec"; lineId: string }
  | { type: "remove"; lineId: string }
  | { type: "clear" };

function signature(itemId: string, selections: VariantSelection[]): string {
  return (
    itemId +
    "|" +
    selections
      .map((s) => `${s.group}:${s.option}`)
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
  }
}

type CartValue = {
  lines: CartLine[];
  totalItems: number;
  totalPrice: number;
  add: (item: MenuItem, quantity: number, selections: VariantSelection[]) => void;
  inc: (lineId: string) => void;
  dec: (lineId: string) => void;
  remove: (lineId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [] });

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
  const totalPrice = state.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const value = useMemo<CartValue>(
    () => ({ lines: state.lines, totalItems, totalPrice, add, inc, dec, remove, clear }),
    [state.lines, totalItems, totalPrice, add, inc, dec, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
