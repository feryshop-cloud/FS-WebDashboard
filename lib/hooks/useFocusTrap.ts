"use client";

import { useEffect, useRef } from "react";

/**
 * Modal/drawer focus management: focuses the container on open, traps Tab
 * inside it, restores focus to the previously-focused element on close, and
 * returns focus to the trigger when `restoreTarget` is provided (e.g. the
 * button that opened the overlay).
 */
export function useFocusTrap<T extends HTMLElement>(
  isOpen: boolean,
  restoreTarget?: HTMLElement | null,
  onEscape?: () => void,
) {
  const containerRef = useRef<T>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    previouslyFocused.current =
      restoreTarget instanceof HTMLElement
        ? restoreTarget
        : (document.activeElement as HTMLElement | null);
    container.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape?.();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === container)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!container.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused.current?.isConnected) {
        previouslyFocused.current.focus();
      }
    };
  }, [isOpen, restoreTarget, onEscape]);

  return containerRef;
}
