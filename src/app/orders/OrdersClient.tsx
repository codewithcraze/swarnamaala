"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { CURRENCY_SYMBOL } from "@/lib/pricing";
import { openRazorpayCheckout } from "@/lib/razorpay";

type Order = {
  _id: string;
  product: string;
  quantity: number;
  unitLabel: string;
  amount: number;
  total?: number;
  subtotal?: number;
  gst?: number;
  images: string[];
  status: string;
  paymentStatus: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  createdAt: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    city: string;
    state: string;
    pincode: string;
  };
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-gold/20 text-terracotta-dark",
  processing: "bg-sky-100 text-sky-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  unpaid: "bg-red-50 text-red-600 border-red-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-orange-50 text-orange-700 border-orange-200",
  refunded: "bg-gold/20 text-terracotta-dark border-gold/40",
};

export default function OrdersClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const showSuccess = searchParams.get("success") === "1";
  const showUpdated = searchParams.get("updated") === "1";
  const paymentPending = searchParams.get("payment") === "pending";
  const pendingOrderId = searchParams.get("orderId");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState("");

  const loadOrders = useCallback(() => {
    fetch("/api/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/signin?redirect=/orders"); return; }
    loadOrders();
  }, [user, authLoading, router, loadOrders]);

  async function handleCancel(id: string) {
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not cancel order");
      setOrders((prev) => prev.map((o) => o._id === id ? { ...o, status: "cancelled" } : o));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not cancel order");
    } finally {
      setCancellingId(null);
    }
  }

  async function handlePayNow(order: Order) {
    setPayError("");
    setPayingId(order._id);
    try {
      // Create / fetch the Razorpay order from our server
      const createRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order._id }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error ?? "Could not initiate payment");

      setPayingId(null); // Release button while modal is open

      // Open Razorpay checkout modal
      const result = await openRazorpayCheckout({
        rzpOrderId: createData.rzpOrderId,
        amount: createData.amount,
        currency: createData.currency,
        keyId: createData.keyId,
        prefill: createData.prefill,
        description: `${order.unitLabel} — swarnamaala.in`,
      });

      if (!result.success) {
        // Record the failed/cancelled payment so it shows in CRM
        await fetch("/api/payment/failed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order._id,
            reason: result.error,
            razorpayPaymentId: result.paymentId,
          }),
        }).catch(() => {}); // best-effort, don't block the UI
        setOrders((prev) =>
          prev.map((o) =>
            o._id === order._id ? { ...o, paymentStatus: "failed" } : o
          )
        );
        setPayError(result.error);
        return;
      }

      setPayingId(order._id);

      // Verify payment on server
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order._id,
          razorpayOrderId: result.razorpayOrderId,
          razorpayPaymentId: result.paymentId,
          razorpaySignature: result.signature,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error ?? "Payment verification failed");

      // Optimistically update UI
      setOrders((prev) =>
        prev.map((o) =>
          o._id === order._id
            ? { ...o, paymentStatus: "paid", razorpayPaymentId: result.paymentId }
            : o
        )
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Payment failed. Please try again.";
      // Record the failed payment so it shows in CRM
      await fetch("/api/payment/failed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order._id, reason: errorMsg }),
      }).catch(() => {});
      setOrders((prev) =>
        prev.map((o) =>
          o._id === order._id ? { ...o, paymentStatus: "failed" } : o
        )
      );
      setPayError(errorMsg);
    } finally {
      setPayingId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted">
          <svg className="h-8 w-8 animate-spin text-terracotta" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="text-sm">Loading your orders…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">

      {/* Success banner */}
      {showSuccess && (
        <div className="mb-6 flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-emerald-700">Order placed &amp; payment confirmed!</p>
            <p className="mt-1 text-sm text-emerald-600">
              We&apos;ve received your order. Sit back — we&apos;ll start printing right away.
            </p>
          </div>
        </div>
      )}

      {/* Updated banner */}
      {showUpdated && (
        <div className="mb-6 rounded-2xl border border-line bg-gold/15 p-5">
          <p className="font-semibold text-terracotta-dark">Order updated successfully!</p>
          <p className="mt-1 text-sm text-muted">Your changes have been saved.</p>
        </div>
      )}

      {/* Payment-pending banner */}
      {paymentPending && pendingOrderId && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-terracotta/40 bg-terracotta/8 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-terracotta-dark">⚠ Payment incomplete</p>
            <p className="mt-1 text-sm text-muted">
              Your order was created but payment wasn&apos;t completed. Click Pay Now to finish.
            </p>
          </div>
          <button
            onClick={() => {
              const order = orders.find((o) => o._id === pendingOrderId);
              if (order) handlePayNow(order);
            }}
            className="shrink-0 rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-dark"
          >
            Pay Now
          </button>
        </div>
      )}

      {/* Global pay error */}
      {payError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-600">{payError}</p>
          <button onClick={() => setPayError("")} className="mt-1 text-xs text-red-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-charcoal">My Orders</h1>
        <Link
          href="/products/custom-magnets"
          className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-dark"
        >
          + New order
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-line bg-white p-12 text-center shadow-sm">
          <div className="text-5xl">🧲</div>
          <p className="mt-4 text-lg font-semibold text-charcoal">No orders yet</p>
          <p className="mt-1 text-sm text-muted">Upload your photos and create your first custom magnet.</p>
          <Link
            href="/products/custom-magnets"
            className="mt-6 inline-block rounded-full bg-terracotta px-6 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-dark"
          >
            Start creating
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const imgs = order.images ?? [];
            const total = order.total ?? order.amount;
            const isPaid = order.paymentStatus === "paid";
            const isUnpaid = order.paymentStatus === "unpaid";
            const isPending = order.status === "pending";
            const isCancelled = order.status === "cancelled";

            return (
              <div
                key={order._id}
                className={`rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
                  isUnpaid && !isCancelled ? "border-terracotta/40" : "border-line"
                }`}
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
                  {/* Thumbnails */}
                  <div className="flex shrink-0 -space-x-3">
                    {imgs.slice(0, 3).map((url, i) => (
                      <div
                        key={i}
                        className="relative h-20 w-20 overflow-hidden rounded-xl border-2 border-white ring-1 ring-line"
                        style={{ zIndex: 3 - i }}
                      >
                        <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                      </div>
                    ))}
                    {imgs.length > 3 && (
                      <div className="grid h-20 w-20 place-items-center rounded-xl border-2 border-white bg-cream text-sm font-semibold text-charcoal ring-1 ring-line">
                        +{imgs.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-charcoal">{order.product}</h2>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ORDER_STATUS_STYLES[order.status] ?? "bg-cream text-charcoal"}`}>
                        {order.status}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${PAYMENT_STATUS_STYLES[order.paymentStatus] ?? "bg-cream text-charcoal"}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {order.unitLabel} &bull;{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      {order.shippingAddress.fullName}, {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state} – {order.shippingAddress.pincode}
                    </p>
                    {isPaid && order.razorpayPaymentId && (
                      <p className="mt-1 text-xs text-muted">
                        Payment ID:{" "}
                        <span className="font-mono text-charcoal">{order.razorpayPaymentId}</span>
                      </p>
                    )}
                    {isPaid && order.paidAt && (
                      <p className="mt-0.5 text-xs text-muted">
                        Paid on{" "}
                        {new Date(order.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>

                  {/* Amount + actions */}
                  <div className="flex flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-terracotta">
                        {CURRENCY_SYMBOL}{total}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {/* Pay Now — shown for unpaid, non-cancelled orders */}
                      {isUnpaid && !isCancelled && (
                        <button
                          onClick={() => handlePayNow(order)}
                          disabled={payingId === order._id}
                          className="flex items-center gap-1.5 rounded-full bg-terracotta px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-terracotta-dark disabled:opacity-60"
                        >
                          {payingId === order._id ? (
                            <>
                              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                              </svg>
                              Processing…
                            </>
                          ) : (
                            <>💳 Pay Now</>
                          )}
                        </button>
                      )}

                      {/* Edit — only for pending + unpaid */}
                      {isPending && isUnpaid && (
                        <Link
                          href={`/orders/${order._id}/edit`}
                          className="rounded-full border border-line bg-white px-4 py-1.5 text-xs font-semibold text-charcoal hover:bg-cream"
                        >
                          Edit
                        </Link>
                      )}

                      {/* Cancel — only for pending + unpaid */}
                      {isPending && isUnpaid && (
                        <button
                          onClick={() => handleCancel(order._id)}
                          disabled={cancellingId === order._id}
                          className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          {cancellingId === order._id ? "Cancelling…" : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Unpaid warning bar */}
                {isUnpaid && !isCancelled && (
                  <div className="flex items-center justify-between gap-3 rounded-b-2xl border-t border-terracotta/20 bg-terracotta/5 px-4 py-2.5 text-xs text-terracotta-dark">
                    <span>⚠ Payment pending — your order will be confirmed once payment is complete.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
