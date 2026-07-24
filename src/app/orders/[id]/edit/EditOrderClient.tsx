"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PRICING_TIERS, getTier, CURRENCY_SYMBOL } from "@/lib/pricing";

type Address = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

const EMPTY_ADDRESS: Address = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

export default function EditOrderClient({ orderId }: { orderId: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [quantity, setQuantity] = useState<number>(3);
  const [images, setImages] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);

  const [status, setStatus] = useState<string>("pending");
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.order) {
        setNotFound(true);
        return;
      }
      const o = data.order;
      setQuantity(o.quantity);
      setImages(Array.isArray(o.images) ? o.images : []);
      setNote(o.note ?? "");
      setStatus(o.status ?? "pending");
      setAddress({
        fullName: o.shippingAddress?.fullName ?? "",
        phone: o.shippingAddress?.phone ?? "",
        line1: o.shippingAddress?.line1 ?? "",
        line2: o.shippingAddress?.line2 ?? "",
        city: o.shippingAddress?.city ?? "",
        state: o.shippingAddress?.state ?? "",
        pincode: o.shippingAddress?.pincode ?? "",
      });
    } catch {
      setNotFound(true);
    } finally {
      setLoadingOrder(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/signin?redirect=/orders/${orderId}/edit`);
      return;
    }
    loadOrder();
  }, [user, authLoading, router, orderId, loadOrder]);

  // Trim extra photos if the pack is made smaller.
  useEffect(() => {
    setImages((imgs) => (imgs.length > quantity ? imgs.slice(0, quantity) : imgs));
  }, [quantity]);

  const tier = getTier(quantity)!;
  const remaining = quantity - images.length;
  const editable = status === "pending";

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    return data.url as string;
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError("");

    const slots = quantity - images.length;
    if (slots <= 0) {
      setError(`You already added ${quantity} photos for this pack.`);
      return;
    }

    setUploading(true);
    try {
      const toUpload = files.slice(0, slots);
      const urls: string[] = [];
      for (const file of toUpload) {
        urls.push(await uploadFile(file));
      }
      setImages((prev) => [...prev, ...urls].slice(0, quantity));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function useForAll(url: string) {
    setImages(Array.from({ length: quantity }, () => url));
  }

  function openPicker() {
    fileRef.current?.click();
  }

  function updateAddress(field: keyof Address, value: string) {
    setAddress((a) => ({ ...a, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (images.length !== quantity) {
      setError(
        `Please add ${quantity} ${quantity === 1 ? "photo" : "photos"} (one for each magnet).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          amount: tier.price,
          images,
          note,
          shippingAddress: address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update order");
      router.push("/orders?updated=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update order");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loadingOrder) {
    return <div className="py-24 text-center text-slate-500">Loading your order...</div>;
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-lg font-semibold text-white">Order not found</p>
        <p className="mt-1 text-sm text-slate-400">
          This order doesn&apos;t exist or doesn&apos;t belong to your account.
        </p>
        <Link
          href="/orders"
          className="mt-6 inline-block rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/orders" className="hover:text-blue-400">
          My Orders
        </Link>{" "}
        / <span className="text-slate-300">Edit order</span>
      </nav>

      <h1 className="text-2xl font-bold text-white sm:text-3xl">Edit your order</h1>
      <p className="mt-2 text-slate-400">
        Update your pack, photos or shipping details. Changes are saved instantly.
      </p>

      {!editable && (
        <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
          <p className="text-sm font-medium text-amber-200">
            This order is <span className="capitalize">{status}</span> and can no longer be edited.
            Please contact us if you need help.
          </p>
          <Link
            href="/orders"
            className="mt-3 inline-block rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-sm font-semibold text-slate-200"
          >
            Back to orders
          </Link>
        </div>
      )}

      {editable && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Quantity */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              1. Pack size
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PRICING_TIERS.map((t) => (
                <button
                  key={t.quantity}
                  type="button"
                  onClick={() => setQuantity(t.quantity)}
                  className={`relative rounded-xl border p-4 text-center transition-all ${
                    quantity === t.quantity
                      ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/40"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                  }`}
                >
                  {t.badge && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {t.badge}
                    </span>
                  )}
                  <p className="text-lg font-bold text-white">{t.quantity}</p>
                  <p className="text-xs text-slate-400">
                    {t.quantity === 1 ? "magnet" : "magnets"}
                  </p>
                  <p className="mt-1 font-semibold text-blue-400">
                    {CURRENCY_SYMBOL}
                    {t.price}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Photos */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                2. Photos
              </h2>
              <span className="text-xs text-slate-500">
                {images.length} of {quantity} added
                {remaining > 0 ? ` \u2022 ${remaining} to go` : " \u2022 all set"}
              </span>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFiles}
              className="hidden"
            />

            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Array.from({ length: quantity }).map((_, i) => {
                const url = images[i];
                if (url) {
                  return (
                    <div
                      key={i}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-slate-700 bg-slate-950"
                    >
                      <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="120px" />
                      <span className="absolute left-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        #{i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label={`Remove photo ${i + 1}`}
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-black/60 text-white transition-colors hover:bg-rose-600"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                      {quantity > 1 && (
                        <button
                          type="button"
                          onClick={() => useForAll(url)}
                          className="absolute inset-x-0 bottom-0 bg-black/65 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          Use for all
                        </button>
                      )}
                    </div>
                  );
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={openPicker}
                    disabled={uploading}
                    className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/40 text-slate-500 transition-colors hover:border-blue-500/60 hover:text-blue-300 disabled:opacity-60"
                  >
                    <span className="text-center text-xs">
                      <span className="block text-2xl">+</span>
                      Add
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openPicker}
                disabled={uploading || remaining <= 0}
                className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload photos"}
              </button>
              {images.length > 0 && quantity > 1 && (
                <button
                  type="button"
                  onClick={() => useForAll(images[0])}
                  className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800"
                >
                  Use photo #1 for all {quantity}
                </button>
              )}
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={() => setImages([])}
                  className="text-xs font-medium text-slate-500 hover:text-rose-400"
                >
                  Clear all
                </button>
              )}
            </div>
          </section>

          {/* Shipping */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              3. Shipping details
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Full name" className="col-span-2 sm:col-span-1">
                <input
                  value={address.fullName}
                  onChange={(e) => updateAddress("fullName", e.target.value)}
                  className="input"
                  placeholder="Your name"
                />
              </Field>
              <Field label="Phone" className="col-span-2 sm:col-span-1">
                <input
                  value={address.phone}
                  onChange={(e) => updateAddress("phone", e.target.value)}
                  className="input"
                  placeholder="10-digit mobile"
                />
              </Field>
              <Field label="Address line 1" className="col-span-2">
                <input
                  value={address.line1}
                  onChange={(e) => updateAddress("line1", e.target.value)}
                  className="input"
                  placeholder="House no., street"
                />
              </Field>
              <Field label="Address line 2 (optional)" className="col-span-2">
                <input
                  value={address.line2}
                  onChange={(e) => updateAddress("line2", e.target.value)}
                  className="input"
                  placeholder="Landmark, area"
                />
              </Field>
              <Field label="City" className="col-span-1">
                <input
                  value={address.city}
                  onChange={(e) => updateAddress("city", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="State" className="col-span-1">
                <input
                  value={address.state}
                  onChange={(e) => updateAddress("state", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Pincode" className="col-span-2 sm:col-span-1">
                <input
                  value={address.pincode}
                  onChange={(e) => updateAddress("pincode", e.target.value)}
                  className="input"
                  placeholder="6-digit"
                  inputMode="numeric"
                />
              </Field>
            </div>
            <Field label="Order note (optional)" className="mt-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input min-h-20 resize-y"
                placeholder="Any special instructions?"
              />
            </Field>
          </section>

          {/* Summary + actions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-semibold text-white">Total</span>
              <span className="text-2xl font-extrabold text-blue-400">
                {CURRENCY_SYMBOL}
                {tier.price}
              </span>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-rose-500/15 px-4 py-2.5 text-sm text-rose-300">
                {error}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save changes"}
              </button>
              <Link
                href="/orders"
                className="rounded-full border border-slate-700 bg-slate-900 px-6 py-3.5 text-center text-base font-semibold text-slate-200 transition-colors hover:bg-slate-800"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}
