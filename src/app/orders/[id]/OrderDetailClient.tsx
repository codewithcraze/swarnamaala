"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { OrderTimeline, StatePill, formatDate } from "@/components/OrderParts";
import { CURRENCY_SYMBOL } from "@/lib/pricing";
import { payOrder } from "@/lib/payOrder";
import { viewState, needsPayment, canEdit, STATE_NOTE } from "@/lib/orderView";

type Order = {
  _id: string;
  product: string;
  quantity: number;
  unitLabel: string;
  amount: number;
  subtotal?: number;
  total?: number;
  discount?: number;
  couponCode?: string | null;
  codFee?: number;
  images: string[];
  note?: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  createdAt: string;
  shippingAddress: {
    fullName: string; phone: string; line1: string; line2?: string;
    city: string; state: string; pincode: string;
  };
};

// Read-only view of one order. Edit/Cancel only appear while the order is
// still pending and unpaid; processing/shipped/delivered orders are view-only.
export default function OrderDetailClient({ id }: { id: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load this order.");
      setOrder(data.order);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this order.");
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/signin?redirect=/orders/${id}`);
      return;
    }
    load();
  }, [user, authLoading, router, id, load]);

  // Close the photo viewer with Escape / move with arrow keys.
  useEffect(() => {
    if (lightbox === null || !order) return;
    const n = order.images.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % n));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + n) % n));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, order]);

  async function pay() {
    if (!order) return;
    setError("");
    setBusy(true);
    try {
      await payOrder(order._id, `${order.unitLabel} — swarnamaala.in`);
      router.push("/orders?success=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!order || !window.confirm("Cancel this order? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${order._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not cancel order");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel order");
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "inline-flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-line px-4 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:border-muted disabled:opacity-50";

  if (!order) {
    return (
      <div className="mx-auto max-w-[1000px] px-4 pb-20 pt-8 sm:px-6">
        {error ? (
          <div className="rounded-[22px] border border-line bg-surface p-10 text-center">
            <p className="font-semibold text-charcoal">{error}</p>
            <Link href="/orders" className={`${btn} mt-5`}>← Back to orders</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="shimmer h-10 w-48 rounded-xl" />
            <div className="shimmer h-[160px] rounded-[22px] border border-line" />
            <div className="shimmer h-[280px] rounded-[22px] border border-line" />
          </div>
        )}
      </div>
    );
  }

  const s = viewState(order);
  const payable = needsPayment(order);
  const editable = canEdit(order);
  const total = order.total ?? order.amount;
  const a = order.shippingAddress;

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
      <Link href="/orders" className="text-sm text-muted hover:text-charcoal">← My orders</Link>

      <div className="mb-6 mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[26px] font-bold tracking-tight text-charcoal sm:text-[34px]">
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDate(order.createdAt, true)}</p>
        </div>
        <StatePill state={s} />
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* Progress */}
      <section className="mb-5 rounded-[22px] border border-line bg-surface px-3 py-6 sm:px-6">
        {s === "cancelled" ? (
          <p className="text-center text-sm text-muted">{STATE_NOTE.cancelled}</p>
        ) : (
          <>
            <OrderTimeline order={order} />
            <p className="mt-5 text-center text-sm text-muted">{STATE_NOTE[s]}</p>
          </>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Photos */}
        <section className="min-w-0 rounded-[22px] border border-line bg-surface p-5 sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-charcoal">
            Your photos <span className="font-normal text-muted">· {order.images.length}</span>
          </h2>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {order.images.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightbox(i)}
                className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border border-line bg-black"
                aria-label={`View photo ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Photo ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <span className="absolute left-1.5 top-1.5 rounded-md bg-[#110d0a]/70 px-1.5 py-0.5 text-[10px] font-medium text-white">#{i + 1}</span>
              </button>
            ))}
          </div>
          {order.note && (
            <div className="mt-5 rounded-xl border border-line bg-cream/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your note</p>
              <p className="mt-1 text-sm text-charcoal">{order.note}</p>
            </div>
          )}
        </section>

        {/* Summary */}
        <aside className="grid content-start gap-5">
          <section className="rounded-[22px] border border-line bg-surface p-5 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-charcoal">Summary</h2>
            <dl className="grid gap-2.5 text-sm">
              <Row label={order.unitLabel} value={`${CURRENCY_SYMBOL}${order.subtotal ?? total}`} />
              {!!order.discount && (
                <Row label={`Coupon${order.couponCode ? ` ${order.couponCode}` : ""}`} value={`−${CURRENCY_SYMBOL}${order.discount}`} accent />
              )}
              {!!order.codFee && <Row label="COD handling" value={`+${CURRENCY_SYMBOL}${order.codFee}`} />}
              <div className="mt-1 flex items-center justify-between border-t border-line pt-3">
                <dt className="font-semibold text-charcoal">Total</dt>
                <dd className="text-2xl font-bold text-terracotta">{CURRENCY_SYMBOL}{total}</dd>
              </div>
            </dl>
            <p className="mt-4 text-[13px] text-muted">
              {order.paymentMethod === "cod" ? "Cash on delivery" : "Online payment"}
              {order.paymentStatus === "paid" && order.paidAt && ` · paid ${formatDate(order.paidAt)}`}
            </p>
            {order.razorpayPaymentId && (
              <p className="mt-1 break-all font-mono text-[12px] text-muted">{order.razorpayPaymentId}</p>
            )}
          </section>

          <section className="rounded-[22px] border border-line bg-surface p-5 sm:p-6">
            <h2 className="mb-3 text-base font-semibold text-charcoal">Shipping to</h2>
            <p className="text-sm text-charcoal">{a.fullName}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ""}
              <br />
              {a.city}, {a.state} – {a.pincode}
              <br />
              {a.phone}
            </p>
          </section>

          {(payable || editable) && (
            <section className="grid gap-2.5">
              {payable && (
                <button onClick={pay} disabled={busy} className={`${btn} border-terracotta bg-terracotta py-3 text-onaccent hover:brightness-110`}>
                  {busy ? "Processing…" : s === "failed" ? "Retry payment" : "Pay now"}
                </button>
              )}
              {editable && (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link href={`/orders/${order._id}/edit`} className={btn}>Edit</Link>
                  <button onClick={cancel} disabled={busy} className={`${btn} text-red-600 dark:text-red-400 hover:border-red-400 hover:bg-red-500/10`}>
                    Cancel
                  </button>
                </div>
              )}
            </section>
          )}
        </aside>
      </div>

      {/* Photo viewer */}
      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${lightbox + 1} of ${order.images.length}`}
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[100] grid place-items-center bg-[#0b0806]/90 p-4 backdrop-blur-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.images[lightbox]}
            alt={`Photo ${lightbox + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
          />
          <button onClick={() => setLightbox(null)} aria-label="Close" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-surface text-xl text-charcoal">
            ×
          </button>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-surface px-3 py-1 text-xs text-muted">
            {lightbox + 1} / {order.images.length}
          </span>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={accent ? "font-medium text-emerald-700 dark:text-emerald-400" : "font-medium text-charcoal"}>{value}</dd>
    </div>
  );
}
