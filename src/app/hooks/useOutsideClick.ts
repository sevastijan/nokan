// src/app/hooks/useOutsideClick.ts
"use client";

import { RefObject, useEffect } from "react";

/**
 * Call `handler` when a click or touchstart happens outside the given ref(s).
 *
 * @param refs One ref or array of refs (RefObject<T> where T extends HTMLElement).
 * @param handler Function to call when click/touch happens outside all provided refs.
 */
export function useOutsideClick<T extends HTMLElement>(
  refs: RefObject<T> | RefObject<T>[],
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    if (!handler) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const refArray = Array.isArray(refs) ? refs : [refs];
      for (const r of refArray) {
        const el = r.current;
        if (el && el.contains(target)) {
          // click is inside one of the refs → do nothing
          return;
        }
      }
      // clicked outside all refs
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [refs, handler]);
}
