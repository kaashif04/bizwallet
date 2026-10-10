"use client";

import { useEffect, useRef } from "react";

// Bottom-sheet manners: the phone's back gesture/button and Esc close the
// sheet (instead of leaving the menu), and the page behind doesn't scroll.
export function useSheet(onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    let poppedByBack = false;
    // Keep Next.js's own history state so its router treats this entry as its own.
    history.pushState({ ...history.state, sheet: true }, "");
    const onPop = () => {
      poppedByBack = true;
      close.current();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      // Closed by a button/tap: drop the history entry we added.
      if (!poppedByBack && history.state?.sheet) history.back();
    };
  }, []);
}
