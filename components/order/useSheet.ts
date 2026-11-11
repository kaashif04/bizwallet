"use client";

import { useEffect, useRef } from "react";

type Entry = { close: { current: () => void }; popped: boolean };

// Open sheets, innermost last: back/Esc only close the top one, so a sheet opened from
// another sheet (pickup time inside the cart) closes alone.
const stack: Entry[] = [];
// History pops we caused ourselves (a sheet closed by a tap drops its own entry): not a back gesture.
let ownPops = 0;
let listening = false;

// One listener for all sheets (a per-sheet one is already gone when our own pop arrives).
function onPop() {
  if (ownPops > 0) {
    ownPops--;
    return;
  }
  const top = stack[stack.length - 1];
  if (!top) return;
  top.popped = true;
  top.close.current();
}
function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") stack[stack.length - 1]?.close.current();
}

// Bottom-sheet manners: the phone's back gesture/button and Esc close the
// sheet (instead of leaving the menu), and the page behind doesn't scroll.
export function useSheet(onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!listening) {
      listening = true;
      window.addEventListener("popstate", onPop);
      window.addEventListener("keydown", onKey);
    }
    const entry: Entry = { close, popped: false };
    stack.push(entry);
    // Keep Next.js's own history state so its router treats this entry as its own.
    history.pushState({ ...history.state, sheet: true }, "");
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflow;
      stack.splice(stack.indexOf(entry), 1);
      // Closed by a button/tap: drop the history entry we added.
      if (!entry.popped && history.state?.sheet) {
        ownPops++;
        history.back();
      }
    };
  }, []);
}
