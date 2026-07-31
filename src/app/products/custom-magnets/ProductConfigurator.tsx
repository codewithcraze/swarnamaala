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

const STEPS = [
  { id: 1, label: "Pack" },
  { id: 2, label: "Photos" },
  { id: 3, label: "Shipping" },
] as const;

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
  const [pendingCount, setPendingCount] = useState(0);
  const [note, setNote] = useState("");
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

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

    const toUpload = files.slice(0, slots);
    setUploading(true);
    setPendingCount(toUpload.length);
    try {
      const results = await Promise.allSettled(toUpload.map(uploadFile));
      const urls = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
        .map((r) => r.value);
      const failed = results.some((r) => r.status === "rejected");

      if (urls.length > 0) {
        setImages((prev) => [...prev, ...urls].slice(0, quantity));
      }
      if (failed) {
        setError("Some photos failed to upload. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setPendingCount(0);
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

  function goToStep(target: 1 | 2 | 3) {
    // allow free navigation backwards, gate navigation forwards
    if (target <= step) {
      setError("");
      setStep(target);
      return;
    }
    if (step === 1 && target >= 2) {
      setError("");
      setStep(2);
    }
    if (target === 3) {
      if (images.length !== quantity) {
        setError(
          `Please add ${quantity} ${quantity === 1 ? "photo" : "photos"} (one for each magnet).`
        );
        return;
      }
      setError("");
      setStep(3);
    }
  }

  function handleNext() {
    if (step === 1) {
      setError("");
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!user) {
        setNeedsLogin(true);
        setError("Please sign in to upload your photos.");
        return;
      }
      if (images.length !== quantity) {
        setError(
          `Please add ${quantity} ${quantity === 1 ? "photo" : "photos"} (one for each magnet).`
        );
        return;
      }
      setError("");
      setStep(3);
    }
  }

  function handleBack() {
    setError("");
    setStep((s) => (s === 3 ? 2 : 1));
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
      setStep(2);
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
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-terracotta">
          Home
        </Link>{" "}
        / <span className="text-charcoal">Custom Photo Magnets</span>
      </nav>

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

      {/* Stepper header */}
      <div className="mb-8">
        <ol className="flex items-center">
          {STEPS.map((s, i) => {
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <li key={s.id} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
                <button
                  type="button"
                  onClick={() => goToStep(s.id)}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors ${
                      isDone
                        ? "bg-terracotta text-white"
                        : isActive
                          ? "border-2 border-terracotta bg-white text-terracotta"
                          : "border border-line bg-white text-muted"
                    }`}
                  >
                    {isDone ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      s.id
                    )}
                  </span>
                  <span
                    className={`hidden text-sm font-medium sm:block ${
                      isActive || isDone ? "text-charcoal" : "text-muted"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <span
                    className={`mx-3 h-0.5 flex-1 rounded-full transition-colors ${
                      step > s.id ? "bg-terracotta" : "bg-line"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: quantity */}
        {step === 1 && (
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
                  className={`relative rounded-xl border p-4 text-center cursor-pointer  transition-all ${
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

            <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-cream/60 px-4 py-3 text-sm">
              <span className="text-muted">{quantityLabel(quantity)}</span>
              <span className="font-semibold text-terracotta">
                {CURRENCY_SYMBOL}
                {pricing.total} <span className="font-normal text-muted">(incl. GST)</span>
              </span>
            </div>
          </section>
        )}

        {/* Step 2: upload photos (one per magnet) */}
        {step === 2 && (
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
                const isUploadingHere = !url && i < images.length + pendingCount;

                if (isUploadingHere) {
                  return (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-xl border border-line bg-cream"
                    >
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-cream via-white to-cream bg-[length:200%_200%]" />
                      <div className="absolute inset-0 grid place-items-center">
                        <svg
                          className="h-6 w-6 animate-spin text-terracotta"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          <path
                            className="opacity-90"
                            d="M22 12a10 10 0 0 0-10-10"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  );
                }
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
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-charcoal transition-colors hover:bg-cream disabled:opacity-50"
              >
                {uploading && (
                  <svg className="h-3.5 w-3.5 animate-spin text-terracotta" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path
                      className="opacity-90"
                      d="M22 12a10 10 0 0 0-10-10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {uploading ? `Uploading ${pendingCount > 1 ? `${pendingCount} photos` : "photo"}...` : "Upload photos"}
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
        )}

        {/* Step 3: shipping + summary */}
        {step === 3 && (
          <>
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
          </>
        )}

        {/* Error shown on steps 1 & 2 (step 3 shows it inside the summary card) */}
        {error && step !== 3 && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
        )}

        {/* Step navigation */}
        {step !== 3 && (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="cursor-pointer rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-0"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={uploading}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-terracotta px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-terracotta-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path
                    className="opacity-90"
                    d="M22 12a10 10 0 0 0-10-10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {uploading ? "Uploading..." : "Continue"}
            </button>
          </div>
        )}
        {step === 3 && (
          <div className="flex items-center justify-start pt-1">
            <button
              type="button"
              onClick={handleBack}
              className="cursor-pointer rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-cream"
            >
              Back
            </button>
          </div>
        )}
      </form>

      <CustomerReviews />
    </div>
  );
}

const CUSTOMER_REVIEWS: {
  name: string;
  location: string;
  rating: number;
  text: string;
  photo: string;
  verified: boolean;
}[] = [
  {
    name: "Priya S.",
    location: "Mumbai",
    rating: 5,
    text: "The print quality blew me away — colors are exactly like the original photo. Fridge looks so much happier now!",
    photo: "/uploads/customer.png",
    verified: true,
  },
  {
    name: "Rohit K.",
    location: "Bengaluru",
    rating: 5,
    text: "Ordered a 9-pack for my parents' anniversary. Packaging was solid and delivery was faster than expected.",
    photo: "/uploads/customer2.png",
    verified: true,
  },
  // {
  //   name: "Anjali M.",
  //   location: "Delhi",
  //   rating: 5,
  //   text: "Gifted these to my sister for her housewarming — she literally teared up. Quality feels premium, not flimsy at all.",
  //   photo: "https://picsum.photos/seed/magnet-review-3/400/400",
  //   verified: true,
  // },
  // {
  //   name: "Karan V.",
  //   location: "Pune",
  //   rating: 4,
  //   text: "Great value for the price. Magnets are strong enough to hold a few postcards too. Would order again.",
  //   photo: "https://picsum.photos/seed/magnet-review-4/400/400",
  //   verified: true,
  // },
];

function CustomerReviews() {
  const avgRating =
    CUSTOMER_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / CUSTOMER_REVIEWS.length;

  return (
    <section className="mt-16 border-t border-line pt-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-lg font-bold text-charcoal">Loved by 2,000+ happy customers</h2>
          <div className="mt-1.5 flex items-center gap-2">
            <Stars rating={avgRating} size={16} />
            <span className="text-sm font-semibold text-charcoal">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-muted">out of 5 · based on 500+ reviews</span>
          </div>
        </div>
        <p className="text-sm text-muted">
          Real photos from real orders — see the quality before you buy.
        </p>
      </div>

      {/* Mobile: horizontal snap scroll. Desktop: grid */}
      <div className="mt-6 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
        {CUSTOMER_REVIEWS.map((r, i) => (
          <div
            key={i}
            className="w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-white shadow-sm sm:w-auto"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.photo}
                alt={`Magnets received by ${r.name}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {r.verified && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-terracotta shadow-sm">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Verified buyer
                </span>
              )}
            </div>
            <div className="p-4">
              <Stars rating={r.rating} size={13} />
              <p className="mt-2 text-sm leading-relaxed text-charcoal">&ldquo;{r.text}&rdquo;</p>
              <p className="mt-3 text-xs font-semibold text-muted">
                {r.name} <span className="font-normal">· {r.location}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Trust strip */}
      <div className="mt-8 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-cream/60 p-5 sm:grid-cols-4">
        <TrustBadge label="Free shipping" sub="On all orders" />
        <TrustBadge label="Pay on delivery" sub="No advance needed" />
        <TrustBadge label="Made with care" sub="Printed & packed by hand" />
        <TrustBadge label="Easy returns" sub="Damaged? We'll replace it" />
      </div>
    </section>
  );
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.round(rating);
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
            className={filled ? "text-gold" : "text-line"}
          >
            <path
              d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
}

function TrustBadge({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-semibold text-charcoal">{label}</span>
      <span className="text-xs text-muted">{sub}</span>
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