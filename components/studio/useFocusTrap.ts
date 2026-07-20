"use client";

import { useEffect, type RefObject } from "react";

/**
 * Trap Tab focus within `ref` while `active`, and return focus to whatever was focused
 * before it opened once it closes. Deliberately does NOT set the initial focus or handle
 * Escape — the studio dialogs already focus a specific control (the input / the Cancel
 * button) and close on Escape themselves; this only adds the missing trap + return so
 * keyboard focus can't wander behind an open modal.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab" || !el) return;
      const focusable = Array.from(
        el.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      if (e.shiftKey) {
        if (current === first || !el.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else if (current === last || !el.contains(current)) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [ref, active]);
}
