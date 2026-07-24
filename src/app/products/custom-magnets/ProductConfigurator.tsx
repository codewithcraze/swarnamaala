"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PRICING_TIERS, getTier, CURRENCY_SYMBOL } from "@/lib/pricing";

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
    getTier(initialQty) ? initialQty : 3
  );
  // One image URL per magnet. Length should reach `quantity` before ordering.
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

  // If the user reduces the pack size, drop extra photos.
  useEffect(() => {
    setImages((imgs) => (imgs.length > quantity ? imgs.slice(0, quantity) : imgs));
  }, [quantity]);

  const tier = getTier(quantity)!;
  const remaining = quantity - images.length;

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
    e.target.value = ""; // allow re-selecting the same file
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
        body: JSON.stringify({
          quantity,
          amount: tier.price,
          images,
          note,
          shippingAddress: address,
        }),
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
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-400">
          Home
        </Link>{" "}
        / <span className="text-slate-300">Custom Photo Magnets</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left: preview + info */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Live preview</h2>
              <span className="text-xs text-slate-500">
                {images.length}/{quantity} added
              </span>
            </div>

            {images.length === 0 ? (
              <div className="mt-4 grid aspect-square w-full place-items-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 text-center text-slate-600">
                <div>
                  <div className="text-6xl">{"\uD83D\uDDBC\uFE0F"}</div>
                  <p className="mt-3 text-sm">Your magnet previews appear here</p>
                </div>
              </div>
            ) : (
              <div
                className={`mt-4 grid gap-3 ${
                  quantity === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
                }`}
              >
                {images.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shadow-lg"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
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
            <p className="mt-5 text-center text-xs text-slate-500">
              Each magnet is printed on premium material with a glossy, durable finish.
            </p>
          </div>

          <h1 className="mt-8 text-2xl font-bold text-white sm:text-3xl">
            Custom Photo Magnets
          </h1>
          <p className="mt-3 leading-relaxed text-slate-400">
            Turn any photo into a premium custom magnet. Perfect for family pictures,
            travel memories, pets, logos, and gifts. Upload one photo per magnet, or reuse
            the same photo for the whole pack.
          </p>
        </div>

        {/* Right: configurator */}
        <div>
          {!loading && !user && (
            <div className="mb-6 rounded-2xl border border-blue-500/40 bg-blue-500/10 p-5">
              <p className="text-sm font-medium text-slate-100">
                Please sign in to upload your photos and place an order.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href={`/signin?redirect=${PRODUCT_PATH}`}
                  className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2 text-sm font-semibold text-white"
                >
                  Sign in
                </Link>
                <Link
                  href={`/signup?redirect=${PRODUCT_PATH}`}
                  className="rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-sm font-semibold text-slate-200"
                >
                  Create account
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: quantity */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
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

            {/* Step 2: upload photos (one per magnet) */}
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                  2. Upload your photos
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

              {!loading && !user && needsLogin && (
                <div className="mt-3 flex flex-col gap-3 rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                      <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Please sign in first to upload your photos.
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/signin?redirect=${PRODUCT_PATH}`}
                      className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Sign in
                    </Link>
                    <Link
                      href={`/signup?redirect=${PRODUCT_PATH}`}
                      className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200"
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
                        className="group relative aspect-square overflow-hidden rounded-xl border border-slate-700 bg-slate-950"
                      >
                        <Image
                          src={url}
                          alt={`Photo ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
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
              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG or WebP, up to 10MB each. You can pick multiple photos at once.
              </p>
            </section>

            {/* Step 3: shipping */}
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

            {/* Summary + submit */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {tier.label} ({CURRENCY_SYMBOL}
                  {tier.perPiece} each)
                </span>
                <span className="font-medium text-slate-100">
                  {CURRENCY_SYMBOL}
                  {tier.price}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-3">
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

              <button
                type="submit"
                disabled={submitting || uploading}
                className="mt-4 w-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {!user
                  ? "Sign in to place order"
                  : submitting
                    ? "Placing order..."
                    : `Place order \u2022 ${CURRENCY_SYMBOL}${tier.price}`}
              </button>
              <p className="mt-3 text-center text-xs text-slate-500">
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
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}
