"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { CURRENCY_SYMBOL } from "@/lib/pricing";

type Order = {
  _id: string;
  product: string;
  quantity: number;
  unitLabel: string;
  amount: number;
  images: string[];
  status: string;
  paymentStatus: string;
  createdAt: string;
  shippingAddress: {
    fullName: string;
    city: string;
    state: string;
    pincode: string;
  };
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  processing: "bg-sky-500/15 text-sky-300",
  shipped: "bg-indigo-500/15 text-indigo-300",
  delivered: "bg-emerald-500/15 text-emerald-300",
  cancelled: "bg-rose-500/15 text-rose-300",
};

export default function OrdersClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("success") === "1";

  const showUpdated = searchParams.get("updated") === "1";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/signin?redirect=/orders");
      return;
    }
    fetch("/api/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  async function handleCancel(id: string) {
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not cancel order");
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: "cancelled" } : o))
      );
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not cancel order");
    } finally {
      setCancellingId(null);
    }
  }

  if (authLoading || loading) {
    return <div className="py-24 text-center text-slate-500">Loading your orders...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {showSuccess && (
        <div className="mb-8 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5">
          <p className="font-semibold text-emerald-300">Order placed successfully! {"\uD83C\uDF89"}</p>
          <p className="mt-1 text-sm text-emerald-200/80">
            We&apos;ve received your order and will confirm the details by phone shortly.
          </p>
        </div>
      )}

      {showUpdated && (
        <div className="mb-8 rounded-2xl border border-blue-500/40 bg-blue-500/10 p-5">
          <p className="font-semibold text-blue-300">Order updated successfully!</p>
          <p className="mt-1 text-sm text-blue-200/80">Your changes have been saved.</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">My Orders</h1>
        <Link
          href="/products/fridge-magnets"
          className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          New order
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center backdrop-blur-sm">
          <div className="text-5xl">{"\uD83E\uDDF2"}</div>
          <p className="mt-4 text-lg font-semibold text-white">No orders yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Upload your photos and create your first custom fridge magnet.
          </p>
          <Link
            href="/products/fridge-magnets"
            className="mt-6 inline-block rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white"
          >
            Start creating
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const images = order.images ?? [];
            return (
              <div
                key={order._id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm sm:flex-row sm:items-center"
              >
                <div className="flex -space-x-3">
                  {images.slice(0, 3).map((url, i) => (
                    <div
                      key={i}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-slate-900 ring-1 ring-slate-700"
                      style={{ zIndex: 3 - i }}
                    >
                      <Image src={url} alt={`${order.product} ${i + 1}`} fill className="object-cover" sizes="80px" />
                    </div>
                  ))}
                  {images.length > 3 && (
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border-2 border-slate-900 bg-slate-800 text-sm font-semibold text-slate-200 ring-1 ring-slate-700">
                      +{images.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-white">{order.product}</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        STATUS_STYLES[order.status] ?? "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {order.unitLabel} &bull; Ordered{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-400">
                    Ship to: {order.shippingAddress.fullName}, {order.shippingAddress.city},{" "}
                    {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  </p>
                </div>
                <div className="flex flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-blue-400">
                      {CURRENCY_SYMBOL}
                      {order.amount}
                    </p>
                    <p className="text-xs capitalize text-slate-500">{order.paymentStatus}</p>
                  </div>
                  {order.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/orders/${order._id}/edit`}
                        className="rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleCancel(order._id)}
                        disabled={cancellingId === order._id}
                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-1.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        {cancellingId === order._id ? "Cancelling..." : "Cancel"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
