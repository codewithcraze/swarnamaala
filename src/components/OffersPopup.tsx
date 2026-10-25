"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OFFERS, OFFERS_VERSION } from "@/lib/offers";

type Sale = { name: string; place: string; quantity: number; at: string };

const DISMISS_KEY = `sm-offers-dismissed-${OFFERS_VERSION}`;
const SHOW_AFTER_MS = 4000;
const ROTATE_MS = 7000;

// Pages where the popup would get in the way of a task.
const HIDE_ON = ["/signin", "/signup", "/send-photos", "/orders"];

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// Desktop-only card in the bottom-right corner: running offers on top, and a
// rotating notification of genuine recent orders below. Dismissible; stays
// closed for the rest of the visit (and until the offers change).
export default function OffersPopup() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [i, setI] = useState(0);

  const offers = OFFERS.filter((o) => o.active);
  const hidden = HIDE_ON.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (hidden) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* storage blocked: just show it */
    }
    const t = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    fetch("/api/recent-sales")
      .then((r) => r.json())
      .then((d) => setSales(Array.isArray(d.sales) ? d.sales : []))
      .catch(() => {});
    return () => clearTimeout(t);
  }, [hidden]);

  // Rotate through recent sales.
  useEffect(() => {
    if (!visible || sales.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % sales.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [visible, sales.length]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (hidden || !visible || (offers.length === 0 && sales.length === 0)) return null;
  const sale = sales[i];

  return (
    <aside
      aria-label="Current offers"
      className="fixed bottom-5 right-5 z-40 hidden w-[340px] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/30 lg:block motion-safe:animate-[offers-in_0.45s_ease-out]"
    >
      <div className="flex items-center justify-between gap-3 bg-terracotta px-4 py-2.5 text-onaccent">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex items-center gap-2 text-sm font-bold"
        >
          <span aria-hidden="true">🎁</span>
          Offers running now
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}>
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" onClick={dismiss} aria-label="Close offers" className="grid h-7 w-7 place-items-center rounded-full text-lg leading-none hover:bg-black/10">
          ×
        </button>
      </div>

      {!collapsed && (
        <>
          <ul className="divide-y divide-line">
            {offers.map((o) => (
              <li key={o.id} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-terracotta" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-charcoal">{o.title}</p>
                  <p className="text-xs text-muted">{o.detail}</p>
                </div>
                {o.cta && (
                  <Link
                    href={o.cta.href}
                    onClick={() => setCollapsed(true)}
                    className="flex-none self-center rounded-full bg-terracotta px-3 py-1 text-xs font-semibold text-onaccent hover:bg-terracotta-dark"
                  >
                    {o.cta.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {sale && (
            <div key={i} className="flex items-center gap-3 border-t border-line bg-cream/60 px-4 py-3 motion-safe:animate-[offers-in_0.4s_ease-out]" aria-live="polite">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </span>
              <p className="min-w-0 text-xs leading-snug text-muted">
                <b className="text-charcoal">{sale.name}</b> {sale.place && `${sale.place} `}ordered{" "}
                <b className="text-charcoal">{sale.quantity} magnet{sale.quantity === 1 ? "" : "s"}</b>
                <span className="block text-[11px]">{timeAgo(sale.at)}</span>
              </p>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
