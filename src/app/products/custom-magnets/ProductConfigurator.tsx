"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  PRICING_TIERS,
  getTier,
  computePricing,
  quantityLabel,
  CURRENCY_SYMBOL,
  EXTRA_MAGNET_PRICE,
  MAX_QUANTITY,
  GST_RATE,
} from "@/lib/pricing";

const PRODUCT_PATH = "/products/custom-magnets";

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

export default function ProductConfigurator() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const initialQty = Number(searchParams.get("qty"));
  const [quantity, setQuantity] = useState<number>(
    getTier(initialQty) || initialQty > 10 ? initialQty : 3
  );
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState("");
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setAddress((a) => ({
        ...a,
        fullName: a.fullName || user.name,
        phone: a.phone || (user.phone ?? ""),
      }));
    }
  }, [user]);

  useEffect(() => {
    setImages((imgs) => (imgs.length > quantity ? imgs.slice(0, quantity) : imgs));
  }, [quantity]);

  const pricing = computePricing(quantity) ?? { quantity, subtotal: 0, gst: 0, total: 0 };
  const remaining = quantity - images.length;
  const isCustom = !getTier(quantity);

  function setCustomQuantity(value: number) {
    const v = Math.max(11, Math.min(MAX_QUANTITY, Math.floor(value || 11)));
    setQuantity(v);
  }

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

    if (!user) {
      setNeedsLogin(true);
      return;
    }

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
    if (!user) {
      setNeedsLogin(true);
      return;
    }
    fileRef.current?.click();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!user) {
      router.push(`/signin?redirect=${PRODUCT_PATH}`);
      return;
    }
    if (images.length !== quantity) {
      setError(
        `Please add ${quantity} ${quantity === 1 ? "photo" : "photos"} (one for each magnet).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, images, note, shippingAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not place order");
      router.push("/orders?success=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setSubmitting(false);
    }
  }

  function updateAddress(field: keyof Address, value: string) {
    setAddress((a) => ({ ...a, [field]: value }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-terracotta">
          Home
        </Link>{" "}
        / <span className="text-charcoal">Custom Photo Magnets</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left: preview + info */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-charcoal">Live preview</h2>
              <span className="text-xs text-muted">
                {images.length}/{quantity} added
              </span>
            </div>

            {images.length === 0 ? (
              <div className="mt-4 grid aspect-square w-full place-items-center rounded-2xl border border-dashed border-line bg-cream text-center text-muted">
                <div>
                  <Image
                    src="/placeholder.png"
                    alt="Magnet preview placeholder"
                    width={120}
                    height={120}
                    className="mx-auto h-28 w-28 object-contain opacity-80"
                  />
                  <p className="mt-3 text-sm">Your magnet previews appear here</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="rounded-xl border border-line bg-white p-1 shadow-sm"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-cream">
                      <Image
                        src={url}
                        alt={`Magnet ${i + 1} preview`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 45vw, 200px"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-5 text-center text-xs text-muted">
              Each magnet is printed on premium material with a glossy, durable finish.
            </p>
          </div>

          <h1 className="mt-8 text-2xl font-bold text-charcoal sm:text-3xl">
            Custom Photo Magnets
          </h1>
          <p className="mt-3 leading-relaxed text-muted">
            Turn any photo into a premium custom magnet. Perfect for family pictures,
            travel memories, pets, logos, and gifts. Upload one photo per magnet, or reuse
            the same photo for the whole pack.
          </p>
        </div>

        {/* Right: configurator */}
        <div>
          {!loading && !user && (
            <div className="mb-6 rounded-2xl border border-line bg-gold/10 p-5">
              <p className="text-sm font-medium text-charcoal">
                Please sign in to upload your photos and place an order.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href={`/signin?redirect=${PRODUCT_PATH}`}
                  className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-white"
                >
                  Sign in
                </Link>
                <Link
                  href={`/signup?redirect=${PRODUCT_PATH}`}
                  className="rounded-full border border-line bg-white px-5 py-2 text-sm font-semibold text-charcoal"
                >
                  Create account
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: quantity */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-terracotta">
                1. Choose your pack
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PRICING_TIERS.map((t) => (
                  <button
                    key={t.quantity}
                    type="button"
                    onClick={() => setQuantity(t.quantity)}
                    className={`relative rounded-xl border p-4 text-center transition-all ${
                      quantity === t.quantity
                        ? "border-terracotta bg-terracotta/10 ring-2 ring-terracotta/30"
                        : "border-line bg-white hover:border-terracotta/50"
                    }`}
                  >
                    {t.badge && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-terracotta px-2 py-0.5 text-[10px] font-semibold text-white">
                        {t.badge}
                      </span>
                    )}
                    <p className="text-lg font-bold text-charcoal">{t.quantity}</p>
                    <p className="text-xs text-muted">{t.quantity === 1 ? "magnet" : "magnets"}</p>
                    <p className="mt-1 font-semibold text-terracotta">
                      {CURRENCY_SYMBOL}
                      {t.price}
                    </p>
                  </button>
                ))}
              </div>

              {/* Custom quantity (more than 10) */}
              <div
                className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
                  isCustom ? "border-terracotta bg-terracotta/10 ring-2 ring-terracotta/30" : "border-line bg-white"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-charcoal">Need more than 10?</p>
                  <p className="text-xs text-muted">
                    Each extra magnet is just {CURRENCY_SYMBOL}
                    {EXTRA_MAGNET_PRICE}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomQuantity((isCustom ? quantity : 12) - 1)}
                    aria-label="Decrease quantity"
                    className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-line bg-white text-lg text-charcoal hover:bg-cream"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={11}
                    max={MAX_QUANTITY}
                    value={isCustom ? quantity : ""}
                    placeholder="11+"
                    onChange={(e) => setCustomQuantity(Number(e.target.value))}
                    className="input w-20 text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomQuantity((isCustom ? quantity : 10) + 1)}
                    aria-label="Increase quantity"
                    className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-line bg-white text-lg text-charcoal hover:bg-cream"
                  >
                    +
                  </button>
                </div>
              </div>
            </section>

            {/* Step 2: upload photos (one per magnet) */}
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-terracotta">
                  2. Upload your photos
                </h2>
                <span className="text-xs text-muted">
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

              {!loading && !user && needsLogin && (
                <div className="mt-3 flex flex-col gap-3 rounded-xl border border-terracotta/40 bg-terracotta/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-sm font-semibold text-terracotta-dark">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                      <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Please sign in first to upload your photos.
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/signin?redirect=${PRODUCT_PATH}`}
                      className="rounded-full bg-terracotta px-4 py-2 text-xs font-semibold text-white"
                    >
                      Sign in
                    </Link>
                    <Link
                      href={`/signup?redirect=${PRODUCT_PATH}`}
                      className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-charcoal"
                    >
                      Create account
                    </Link>
                  </div>
                </div>
              )}

              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {Array.from({ length: quantity }).map((_, i) => {
                  const url = images[i];
                  if (url) {
                    return (
                      <div
                        key={i}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-cream"
                      >
                        <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="120px" />
                        <span className="absolute left-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          #{i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          aria-label={`Remove photo ${i + 1}`}
                          className="absolute right-1 top-1 grid h-6 w-6 cursor-pointer place-items-center rounded-md bg-black/60 text-white transition-colors hover:bg-red-600"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                          </svg>
                        </button>
                        {quantity > 1 && (
                          <button
                            type="button"
                            onClick={() => useForAll(url)}
                            className="absolute inset-x-0 bottom-0 cursor-pointer bg-black/65 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
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
                      className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line bg-white text-muted transition-colors hover:border-terracotta/60 hover:text-terracotta disabled:opacity-60"
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
                  className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-charcoal transition-colors hover:bg-cream disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload photos"}
                </button>
                {images.length > 0 && quantity > 1 && (
                  <button
                    type="button"
                    onClick={() => useForAll(images[0])}
                    className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-charcoal transition-colors hover:bg-cream"
                  >
                    Use photo #1 for all {quantity}
                  </button>
                )}
                {images.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setImages([])}
                    className="cursor-pointer text-xs font-medium text-muted hover:text-red-500"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-muted">
                JPG, PNG or WebP, up to 10MB each. You can pick multiple photos at once.
              </p>
            </section>

            {/* Step 3: shipping */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-terracotta">
                3. Shipping details
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Full name" className="col-span-2 sm:col-span-1">
                  <input value={address.fullName} onChange={(e) => updateAddress("fullName", e.target.value)} className="input" placeholder="Your name" />
                </Field>
                <Field label="Phone" className="col-span-2 sm:col-span-1">
                  <input value={address.phone} onChange={(e) => updateAddress("phone", e.target.value)} className="input" placeholder="10-digit mobile" />
                </Field>
                <Field label="Address line 1" className="col-span-2">
                  <input value={address.line1} onChange={(e) => updateAddress("line1", e.target.value)} className="input" placeholder="House no., street" />
                </Field>
                <Field label="Address line 2 (optional)" className="col-span-2">
                  <input value={address.line2} onChange={(e) => updateAddress("line2", e.target.value)} className="input" placeholder="Landmark, area" />
                </Field>
                <Field label="City" className="col-span-1">
                  <input value={address.city} onChange={(e) => updateAddress("city", e.target.value)} className="input" />
                </Field>
                <Field label="State" className="col-span-1">
                  <input value={address.state} onChange={(e) => updateAddress("state", e.target.value)} className="input" />
                </Field>
                <Field label="Pincode" className="col-span-2 sm:col-span-1">
                  <input value={address.pincode} onChange={(e) => updateAddress("pincode", e.target.value)} className="input" placeholder="6-digit" inputMode="numeric" />
                </Field>
              </div>
              <Field label="Order note (optional)" className="mt-3">
                <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input min-h-20 resize-y" placeholder="Any special instructions?" />
              </Field>
            </section>

            {/* Summary + submit */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">{quantityLabel(quantity)}</span>
                <span className="font-medium text-charcoal">
                  {CURRENCY_SYMBOL}
                  {pricing.subtotal}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted">GST ({Math.round(GST_RATE * 100)}%)</span>
                <span className="font-medium text-charcoal">
                  {CURRENCY_SYMBOL}
                  {pricing.gst}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
                <span className="font-semibold text-charcoal">Total</span>
                <span className="text-2xl font-extrabold text-terracotta">
                  {CURRENCY_SYMBOL}
                  {pricing.total}
                </span>
              </div>

              {error && (
                <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || uploading}
                className="mt-4 w-full cursor-pointer rounded-full bg-terracotta px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-terracotta-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {!user
                  ? "Sign in to place order"
                  : submitting
                    ? "Placing order..."
                    : `Place order \u2022 ${CURRENCY_SYMBOL}${pricing.total}`}
              </button>
              <p className="mt-3 text-center text-xs text-muted">
                Pay on delivery available. We&apos;ll confirm your order by phone.
              </p>
            </div>
          </form>
        </div>
      </div>
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
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
