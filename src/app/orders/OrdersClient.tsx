"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Confetti from "@/components/Confetti";
import { OrderThumbs, OrderTimeline, StatePill, formatDate } from "@/components/OrderParts";
import { CURRENCY_SYMBOL } from "@/lib/pricing";
import { payOrder } from "@/lib/payOrder";
import { TABS, type TabKey, viewState, needsPayment, canEdit, STATE_NOTE } from "@/lib/orderView";

type Order = {
  _id: string;
  product: string;
  quantity: number;
  unitLabel: string;
  amount: number;
  total?: number;
  images: string[];
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
  shippingAddress: { fullName: string; city: string; state: string; pincode: string };
};

const PAGE_SIZE = 5;

export default function OrdersClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const placed = params.get("success") === "1" || params.get("success") === "cod";
  const isCodPlaced = params.get("success") === "cod";
  const updated = params.get("updated") === "1";
  const paymentPending = params.get("payment") === "pending";

  const [tab, setTab] = useState<TabKey>("all");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<"placed" | "updated" | "pending" | null>(
    placed ? "placed" : updated ? "updated" : paymentPending ? "pending" : null
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (t: TabKey, p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?tab=${t}&page=${p}&limit=${PAGE_SIZE}`, { cache: "no-store" });
      const data = await res.json();
      setOrders(data.orders ?? []);
      setCounts(data.counts ?? {});
      setPages(data.pages ?? 1);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/signin?redirect=/orders");
      return;
    }
    load(tab, page);
  }, [user, authLoading, router, load, tab, page]);

  function chooseTab(t: TabKey) {
    setTab(t);
    setPage(1);
  }

  async function pay(o: Order) {
    setError("");
    setBusyId(o._id);
    try {
      await payOrder(o._id, `${o.unitLabel} — swarnamaala.in`);
      setBanner("placed");
      await load(tab, page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed.");
      await load(tab, page);
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(o: Order) {
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    setBusyId(o._id);
    try {
      const res = await fetch(`/api/orders/${o._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not cancel order");
      await load(tab, page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel order");
    } finally {
      setBusyId(null);
    }
  }

  const btn =
    "inline-flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-line px-4 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:border-muted disabled:opacity-50";

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
      {placed && <Confetti />}

      {banner && (
        <div
          role="status"
          className={`mb-8 flex items-center gap-3.5 rounded-2xl border px-[18px] py-3.5 ${
            banner === "pending" ? "border-amber-400/40 bg-amber-400/10" : "border-emerald-500/35 bg-emerald-500/10"
          }`}
        >
          <span
            className={`grid h-[30px] w-[30px] flex-none place-items-center rounded-full ${
              banner === "pending" ? "bg-amber-300 text-[#2a1d05]" : "bg-emerald-400 text-[#0d2418]"
            }`}
          >
            {banner === "pending" ? "!" : (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M3 8.5l3.2 3.2L13 4.8" />
              </svg>
            )}
          </span>
          <div>
            <b className="block text-[15px] text-charcoal">
              {banner === "placed"
                ? isCodPlaced ? "Order placed! Pay when it arrives." : "Order placed and payment confirmed!"
                : banner === "updated" ? "Order updated successfully" : "Payment not completed"}
            </b>
            <span className="text-[13.5px] text-muted">
              {banner === "placed"
                ? "We'll start printing right away and email you as it moves along."
                : banner === "updated" ? "Your changes have been saved." : "Your order is saved. Use Pay now below to confirm it."}
            </span>
          </div>
          <button aria-label="Dismiss" onClick={() => setBanner(null)} className="ml-auto cursor-pointer px-2 py-1 text-[22px] leading-none text-muted">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <button onClick={() => setError("")} className="text-xs underline">Dismiss</button>
        </div>
      )}

      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="m-0 text-[28px] font-bold tracking-tight text-charcoal sm:text-[38px]">My Orders</h1>
        <Link href="/products/custom-magnets" className={`${btn} border-terracotta bg-terracotta text-onaccent hover:border-terracotta-dark hover:bg-terracotta-dark`}>
          + New order
        </Link>
      </div>

      {/* Tabs */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-0.5" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => chooseTab(t.key)}
            className={`flex-none cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "border-charcoal bg-charcoal text-onaccent" : "border-line text-muted hover:text-charcoal"
            }`}
          >
            {t.label}
            <em className="ml-1.5 not-italic opacity-70">{counts[t.key] ?? 0}</em>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-[18px]">
          {[0, 1].map((i) => (
            <div key={i} className="shimmer h-[190px] rounded-[22px] border border-line" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-[22px] border border-line bg-surface px-6 py-12 text-center">
          <p className="text-lg font-semibold text-charcoal">{tab === "all" ? "No orders yet" : "No orders here"}</p>
          <p className="mt-1 text-sm text-muted">
            {tab === "all" ? "Upload your photos and create your first custom magnets." : "Try another tab."}
          </p>
          {tab === "all" && (
            <Link href="/products/custom-magnets" className={`${btn} mt-6 border-terracotta bg-terracotta text-onaccent`}>
              Start creating
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-[18px]">
          {orders.map((o) => {
            const s = viewState(o);
            const payable = needsPayment(o);
            const editable = canEdit(o);
            const href = `/orders/${o._id}`;
            return (
              <article
                key={o._id}
                className={`overflow-hidden rounded-[22px] border bg-surface transition-colors hover:border-terracotta/60 ${
                  s === "failed" ? "border-red-400/45" : payable ? "border-amber-300/45" : "border-line"
                }`}
              >
                {/* Whole top area opens the order */}
                <Link href={href} className="block focus-visible:outline-none">
                  <div className="grid grid-cols-1 items-center gap-4 p-[18px] sm:grid-cols-[auto_1fr_auto] sm:gap-6 sm:px-6 sm:py-[22px]">
                    <OrderThumbs images={o.images} />
                    <div className="min-w-0">
                      <h2 className="m-0 mb-0.5 text-lg font-semibold text-charcoal">{o.product}</h2>
                      <div className="text-sm text-muted">
                        {o.quantity} magnet{o.quantity > 1 ? "s" : ""} · {formatDate(o.createdAt)}
                        {o.paymentMethod === "cod" && " · Cash on delivery"}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 truncate text-[13.5px] text-muted">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 flex-none">
                          <path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z" />
                          <circle cx="12" cy="9.5" r="2.5" />
                        </svg>
                        <span className="truncate">
                          {o.shippingAddress.fullName}, {o.shippingAddress.city}, {o.shippingAddress.state} – {o.shippingAddress.pincode}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:block sm:text-right">
                      <div className="text-[26px] font-bold leading-tight tracking-tight text-terracotta">
                        {CURRENCY_SYMBOL}{o.total ?? o.amount}
                      </div>
                      <div className="sm:mt-1.5"><StatePill state={s} /></div>
                    </div>
                  </div>
                  {s !== "cancelled" && (
                    <div className="px-2.5 pb-[18px] sm:px-6 sm:pb-[22px]">
                      <OrderTimeline order={o} compact />
                    </div>
                  )}
                </Link>

                {/* Footer: actions only while the order can still change */}
                <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-line bg-cream/60 px-[18px] py-3.5 sm:px-6">
                  <span className="min-w-[200px] flex-1 text-[13.5px] text-muted">{STATE_NOTE[s]}</span>
                  <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
                    {payable && (
                      <button
                        onClick={() => pay(o)}
                        disabled={busyId === o._id}
                        className={`${btn} flex-1 border-terracotta bg-terracotta text-onaccent hover:brightness-110 sm:flex-none`}
                      >
                        {busyId === o._id ? "Processing…" : s === "failed" ? "Retry payment" : "Pay now"}
                      </button>
                    )}
                    {editable && (
                      <Link href={`/orders/${o._id}/edit`} className={`${btn} flex-1 sm:flex-none`}>Edit</Link>
                    )}
                    {editable && (
                      <button
                        onClick={() => cancel(o)}
                        disabled={busyId === o._id}
                        className={`${btn} flex-1 text-red-400 hover:border-red-400 hover:bg-red-500/10 sm:flex-none`}
                      >
                        Cancel
                      </button>
                    )}
                    <Link href={href} className={`${btn} flex-1 sm:flex-none`}>View details</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={btn}>
            ← Prev
          </button>
          {pageWindow(page, pages).map((n, i) =>
            n === 0 ? (
              <span key={`gap-${i}`} className="px-1 text-muted">…</span>
            ) : (
            <button
              key={n}
              onClick={() => setPage(n)}
              aria-current={n === page ? "page" : undefined}
              className={`h-10 w-10 rounded-xl border-[1.5px] text-sm font-semibold transition-colors ${
                n === page ? "border-terracotta bg-terracotta text-onaccent" : "border-line text-charcoal hover:border-muted"
              }`}
            >
              {n}
            </button>
            )
          )}
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className={btn}>
            Next →
          </button>
        </nav>
      )}
    </div>
  );
}

// Page numbers to show: first, last, and the current page ±1, with 0 marking a gap.
function pageWindow(page: number, pages: number): number[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const keep = new Set([1, pages, page - 1, page, page + 1]);
  const out: number[] = [];
  for (let n = 1; n <= pages; n++) {
    if (keep.has(n)) out.push(n);
    else if (out[out.length - 1] !== 0) out.push(0);
  }
  return out;
}
