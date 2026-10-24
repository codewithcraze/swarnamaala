"use client";

import { useEffect } from "react";

// One celebratory burst in the site's gold palette, fired once on mount.
// Respects reduced-motion; the library is loaded only when needed.
export default function Confetti() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let timers: ReturnType<typeof setTimeout>[] = [];
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const colors = ["#c9a14a", "#dfbd6c", "#e8cf8f", "#f4ece0", "#8a6a26"];
      const fire = (ratio: number, opts: Parameters<typeof confetti>[0]) =>
        confetti({ origin: { y: 0.65 }, colors, zIndex: 9999, ...opts, particleCount: Math.floor(220 * ratio) });

      // Layered burst: tight fast core, wide slow spray, then side cannons.
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
      timers = [
        setTimeout(() => confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, zIndex: 9999 }), 350),
        setTimeout(() => confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, zIndex: 9999 }), 350),
      ];
    });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);
  return null;
}
