"use client";

import { useEffect, useState, type RefObject } from "react";

// Defers mounting heavy content (WebGL) until the element is near the viewport
// AND the browser is idle, so first paint and hydration are never blocked.
// `visible` lets the caller pause rendering while scrolled off-screen.
export function useLazyMount(ref: RefObject<HTMLElement | null>) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let scheduled = false;
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const mount = () => setMounted(true);

    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting && !scheduled) {
          scheduled = true;
          if (typeof window.requestIdleCallback === "function") {
            idleId = window.requestIdleCallback(mount, { timeout: 1500 });
          } else {
            timer = setTimeout(mount, 300);
          }
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timer) clearTimeout(timer);
    };
  }, [ref]);

  return { mounted, visible };
}
