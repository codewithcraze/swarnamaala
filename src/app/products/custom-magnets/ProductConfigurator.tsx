"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ProductImageCarousel from "@/components/ProductImageCarousel";
import BannerCarousel from "@/components/BannerCarousel";
import CustomerLove from "@/components/CustomerLove";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { compressImage, uploadWithProgress, runLimited } from "@/lib/compressImage";
import {
  PRICING_TIERS, getTier, computePricing, quantityLabel,
  CURRENCY_SYMBOL, EXTRA_MAGNET_PRICE, MAX_QUANTITY, COD_FEE,
  MIN_QUANTITY, BASE_PACK_QTY,
} from "@/lib/pricing";

type PaymentMethod = "online" | "cod";

type PendingUpload = {
  id: string;
  preview: string; // local object URL, shown instantly
  progress: number; // 0..1 upload progress
  stage: "optimising" | "uploading";
  file: File;
};

const PRODUCT_PATH = "/products/custom-magnets";

type Address = {
  fullName: string; phone: string; line1: string;
  line2: string; city: string; state: string; pincode: string;
};
const EMPTY_ADDRESS: Address = {
  fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "",
};
const STEPS = [
  { id: 1 as const, label: "Choose Pack", shortLabel: "Pack" },
  { id: 2 as const, label: "Upload Photos", shortLabel: "Photos" },
  { id: 3 as const, label: "Shipping", shortLabel: "Ship" },
  { id: 4 as const, label: "Payment", shortLabel: "Pay" },
];

export default function ProductConfigurator() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const initialQty = Number(searchParams.get("qty"));
  const [quantity, setQuantity] = useState<number>(
    getTier(initialQty) || (initialQty > BASE_PACK_QTY && initialQty <= MAX_QUANTITY)
      ? initialQty
      : MIN_QUANTITY
  );
  const [images, setImages] = useState<string[]>([]);
  // Photos still being optimised/uploaded, shown instantly from a local preview.
  const [pending, setPending] = useState<PendingUpload[]>([]);
  // Uploaded URL -> local preview, so finished photos display instantly instead
  // of being downloaded again from the server.
  const [localSrc, setLocalSrc] = useState<Record<string, string>>({});
  const uploading = pending.length > 0;
  const pendingCount = pending.length;
  const [note, setNote] = useState("");
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<
    { code: string; discount: number; finalTotal: number } | null
  >(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

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
    // Quantity change alters the price, so any applied coupon must be re-validated.
    setAppliedCoupon(null);
    setCouponError("");
  }, [quantity]);

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }
    setCouponError("");
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid coupon");
      setAppliedCoupon({
        code: data.code,
        discount: data.discount,
        finalTotal: data.finalTotal,
      });
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : "Invalid coupon");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  }

  const pricing = computePricing(quantity) ?? { quantity, subtotal: 0, gst: 0, total: 0 };
  const remaining = quantity - images.length;
  const isCustom = !getTier(quantity);

  function setCustomQuantity(value: number) {
    const min = BASE_PACK_QTY + 1; // 19
    const v = Math.max(min, Math.min(MAX_QUANTITY, Math.floor(value || min)));
    setQuantity(v);
  }

  function updatePending(id: string, patch: Partial<PendingUpload>) {
    setPending((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError("");
    if (!user) { setNeedsLogin(true); return; }
    const slots = quantity - images.length - pending.length;
    if (slots <= 0) { setError(`All ${quantity} photos added.`); return; }

    // Show every selected photo immediately from a local preview, then shrink
    // and upload in the background, 3 at a time. Each photo moves into the grid
    // as soon as it finishes instead of waiting for the whole batch.
    const items: PendingUpload[] = files.slice(0, slots).map((file, i) => ({
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      preview: URL.createObjectURL(file),
      progress: 0,
      stage: "optimising",
      file,
    }));
    setPending((list) => [...list, ...items]);

    let failed = 0;
    await runLimited(items, 3, async (item) => {
      try {
        const small = await compressImage(item.file);
        updatePending(item.id, { stage: "uploading" });
        const url = await uploadWithProgress(small, (f) => updatePending(item.id, { progress: f }));
        setLocalSrc((m) => ({ ...m, [url]: item.preview }));
        setImages((prev) => [...prev, url].slice(0, quantity));
      } catch {
        failed++;
        URL.revokeObjectURL(item.preview);
      } finally {
        setPending((list) => list.filter((p) => p.id !== item.id));
      }
    });
    if (failed > 0) {
      setError(`${failed} ${failed === 1 ? "photo" : "photos"} failed to upload. Please try again.`);
    }
  }

  // Free local previews when leaving the page.
  const localSrcRef = useRef(localSrc);
  localSrcRef.current = localSrc;
  useEffect(() => () => Object.values(localSrcRef.current).forEach((u) => URL.revokeObjectURL(u)), []);

  // Display source for an uploaded photo: the instant local preview if we have it.
  const display = (url: string) => localSrc[url] ?? url;

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }
  function useForAll(url: string) {
    setImages(Array.from({ length: quantity }, () => url));
  }
  function openPicker() {
    if (!user) { setNeedsLogin(true); return; }
    fileRef.current?.click();
  }

  function handleBack() {
    setError("");
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : 1));
  }

  function addressComplete() {
    const required: (keyof Address)[] = ["fullName", "phone", "line1", "city", "state", "pincode"];
    return required.every((f) => String(address[f] ?? "").trim());
  }

  function handleNext() {
    if (step === 1) { setError(""); setStep(2); return; }
    if (step === 2) {
      if (!user) { setNeedsLogin(true); setError("Please sign in to continue."); return; }
      if (images.length !== quantity) {
        setError(`Please add ${quantity} ${quantity === 1 ? "photo" : "photos"} (one per magnet).`);
        return;
      }
      setError(""); setStep(3);
      return;
    }
    if (step === 3) {
      if (!addressComplete()) {
        setError("Please complete your shipping details.");
        return;
      }
      if (!/^\d{6}$/.test(String(address.pincode).trim())) {
        setError("Please enter a valid 6-digit pincode.");
        return;
      }
      setError(""); setStep(4);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // form submit is used only for Back navigation; payment is triggered by handlePay
  }

  // Step 3: user clicks "Pay" → create DB order (if needed) → open Razorpay → verify
  async function handlePay() {
    setError("");
    if (!user) { router.push(`/signin?redirect=${PRODUCT_PATH}`); return; }
    if (images.length !== quantity) { setError(`Please add ${quantity} photos.`); setStep(2); return; }

    setSubmitting(true);
    let dbOrderId: string | null = null;
    try {
      // 1. Create the order record in our DB (status: pending, paymentStatus: unpaid)
      const createRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          images,
          note,
          shippingAddress: address,
          couponCode: appliedCoupon?.code ?? null,
          paymentMethod,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error ?? "Could not create order");
      dbOrderId = createData.order.id;

      // Cash on Delivery: the order is placed immediately, no online payment.
      if (paymentMethod === "cod") {
        router.push("/orders?success=cod");
        return;
      }

      // 2. Create a Razorpay order (server-side) and get the rzp order id
      const rzpCreateRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: dbOrderId }),
      });
      const rzpCreateData = await rzpCreateRes.json();
      if (!rzpCreateRes.ok) throw new Error(rzpCreateData.error ?? "Could not initiate payment");

      setSubmitting(false); // release button while modal is open

      // 3. Open Razorpay checkout modal
      const result = await openRazorpayCheckout({
        rzpOrderId: rzpCreateData.rzpOrderId,
        amount: rzpCreateData.amount,
        currency: rzpCreateData.currency,
        keyId: rzpCreateData.keyId,
        prefill: rzpCreateData.prefill,
        description: `${quantity} Custom Photo Magnet${quantity > 1 ? "s" : ""} — swarnamaala.in`,
      });

      if (!result.success) {
        // Payment failed or was dismissed — record it so the CRM can see it
        await fetch("/api/payment/failed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: dbOrderId,
            reason: result.error,
            razorpayPaymentId: result.paymentId,
          }),
        }).catch(() => {});
        setError(result.error);
        router.push(`/orders?payment=pending&orderId=${dbOrderId}`);
        return;
      }

      setSubmitting(true); // back to loading while verifying

      // 4. Verify the payment signature on the server
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: dbOrderId,
          razorpayOrderId: result.razorpayOrderId,
          razorpayPaymentId: result.paymentId,
          razorpaySignature: result.signature,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error ?? "Payment verification failed");

      router.push("/orders?success=1");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Payment failed. Please try again.";
      // Record failed payment if we have an order ID
      if (dbOrderId) {
        await fetch("/api/payment/failed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: dbOrderId, reason: errorMsg }),
        }).catch(() => {});
      }
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  function updateAddress(field: keyof Address, value: string) {
    setAddress((a) => ({ ...a, [field]: value }));
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-terracotta">Home</Link>
        {" / "}
        <span className="text-charcoal">Custom Photo Magnets</span>
      </nav>

      {/* Sign-in nudge */}
      {!loading && !user && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-terracotta/30 bg-terracotta/5 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-charcoal">
            Sign in to upload photos and place your order.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/signin?redirect=${PRODUCT_PATH}`}
              className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-onaccent whitespace-nowrap">
              Sign in
            </Link>
            <Link href={`/signup?redirect=${PRODUCT_PATH}`}
              className="rounded-full border border-line bg-surface px-5 py-2 text-sm font-semibold text-charcoal whitespace-nowrap">
              Create account
            </Link>
          </div>
        </div>
      )}

      <div className="lg:grid lg:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
      {/* <div className="lg:grid"> */}
        {/* LEFT: product info + steps */}
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal sm:text-3xl">
            Custom Photo Magnets
          </h1>
          <p className="mt-1 text-muted">
            Premium glossy print · Strong magnetic grip · Pan-India delivery
          </p>

          {/* Stepper */}
          <div className="mt-6 mb-8 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <ol className="flex items-center min-w-max sm:min-w-0">
              {STEPS.map((s, i) => {
                const isActive = step === s.id;
                const isDone = step > s.id;
                return (
                  <li key={s.id} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
                    <button type="button"
                      onClick={() => { if (isDone) { setError(""); setStep(s.id); } }}
                      className={`flex items-center gap-1.5 sm:gap-2 ${isDone ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <span className={`grid h-7 w-7 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full text-xs sm:text-sm font-semibold transition-colors
                        ${isDone ? "bg-terracotta text-onaccent" : isActive ? "border-2 border-terracotta bg-surface text-terracotta" : "border border-line bg-surface text-muted"}`}>
                        {isDone ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="sm:w-4 sm:h-4">
                            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : s.id}
                      </span>
                      <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${isActive || isDone ? "text-charcoal" : "text-muted"}`}>
                        <span className="hidden sm:inline">{s.label}</span>
                        <span className="sm:hidden">{s.shortLabel}</span>
                      </span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <span className={`mx-1.5 sm:mx-3 h-0.5 w-6 sm:flex-1 rounded-full transition-colors ${step > s.id ? "bg-terracotta" : "bg-line"}`} />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && <Step1 quantity={quantity} setQuantity={setQuantity} isCustom={isCustom}
              setCustomQuantity={setCustomQuantity} pricing={pricing} />}
            {step === 2 && <Step2 quantity={quantity} images={images} uploading={uploading}
              pending={pending} display={display} remaining={remaining} needsLogin={needsLogin}
              user={!!user} loading={loading} fileRef={fileRef} openPicker={openPicker}
              removeImage={removeImage} useForAll={useForAll} handleFiles={handleFiles}
              clearAll={() => setImages([])} />}
            {step === 3 && (
              <Step3 address={address} updateAddress={updateAddress} note={note} setNote={setNote} />
            )}
            {step === 4 && (
              <>
                <PaymentMethodStep paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                  codFee={COD_FEE} />
                <OrderSummary pricing={pricing} quantity={quantity} submitting={submitting}
                  uploading={uploading} user={!!user} error={error}
                  onPay={handlePay} paymentMethod={paymentMethod} codFee={COD_FEE}
                  couponInput={couponInput} setCouponInput={setCouponInput}
                  appliedCoupon={appliedCoupon} couponError={couponError}
                  couponLoading={couponLoading} applyCoupon={applyCoupon} removeCoupon={removeCoupon} />
              </>
            )}

            {error && step !== 4 && (
              <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <button type="button" onClick={handleBack} disabled={step === 1}
                className="cursor-pointer rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-cream disabled:invisible">
                ← Back
              </button>
              {step !== 4 ? (
                <button type="button" onClick={handleNext} disabled={uploading}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-terracotta px-7 py-2.5 text-sm font-semibold text-onaccent shadow-sm transition-colors hover:bg-terracotta-dark disabled:opacity-60 whitespace-nowrap">
                  {uploading && <Spinner />}
                  {uploading ? `Uploading ${pendingCount > 1 ? `${pendingCount} photos` : "photo"}…` : "Continue →"}
                </button>
              ) : null}
            </div>
          </form>

          <CustomerReviews />
        </div>

        {/* RIGHT: carousel (desktop sticky, hidden on mobile) */}
        <aside className="hidden min-w-0 lg:block lg:sticky lg:top-4 lg:self-start">
          <ProductImageCarousel images={images.map(display)} quantity={quantity} uploading={uploading} />
          <div className="mt-4 rounded-2xl border border-line bg-cream/60 p-4 text-sm text-muted">
            <p className="font-semibold text-charcoal">Have questions?</p>
            <p className="mt-1">Chat with us on WhatsApp for instant help.</p>
            <a href="https://wa.me/918368059837" target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-2.5 text-sm font-semibold text-white hover:bg-[#20BD5A] transition-colors">
              <svg viewBox="0 0 32 32" className="h-4 w-4 fill-white" aria-hidden="true">
                <path d="M16.003 3.2C9.004 3.2 3.2 9.004 3.2 16.003c0 2.29.597 4.435 1.64 6.296L3.2 28.8l6.683-1.614A12.7 12.7 0 0 0 16.003 28.8c6.999 0 12.797-5.804 12.797-12.797C28.8 9.004 23.002 3.2 16.003 3.2zm6.3 17.87c-.264.742-1.542 1.458-2.11 1.497-.568.04-1.106.274-3.725-.777-3.15-1.263-5.146-4.42-5.302-4.623-.155-.203-1.268-1.687-1.268-3.22s.802-2.286 1.087-2.599c.284-.313.62-.392.826-.392s.412.003.592.01c.19.008.445-.072.697.533.258.617.876 2.13.955 2.285.08.154.133.334.026.537-.104.203-.156.33-.31.508-.154.18-.324.4-.463.537-.154.151-.313.316-.135.62.178.303.794 1.31 1.706 2.12 1.174 1.048 2.163 1.372 2.466 1.527.303.154.48.13.656-.078.179-.207.759-.885 1.361-1.764l.025-.037c.21-.33.42-.276.7-.166.283.11 1.79.845 2.097.997.308.154.514.228.59.357.077.13.077.745-.187 1.487z" />
              </svg>
              WhatsApp us
            </a>
          </div>
        </aside>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFiles} className="hidden" />
    </div>
  );
}

// ---- Sub-components ----

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Step1({ quantity, setQuantity, isCustom, setCustomQuantity, pricing }: {
  quantity: number; setQuantity: (n: number) => void; isCustom: boolean;
  setCustomQuantity: (n: number) => void; pricing: { total: number };
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-terracotta">1. Choose your pack</h2>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
        {PRICING_TIERS.map((t) => (
          <button key={t.quantity} type="button" onClick={() => setQuantity(t.quantity)}
            className={`relative rounded-xl border p-3 sm:p-4 text-center cursor-pointer transition-all ${
              quantity === t.quantity ? "border-terracotta bg-terracotta/10 ring-2 ring-terracotta/30" : "border-line bg-surface hover:border-terracotta/50"
            }`}>
            {t.badge && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-terracotta px-2 sm:px-2.5 py-0.5 text-[10px] font-semibold text-onaccent">
                {t.badge}
              </span>
            )}
            <p className="text-xl sm:text-2xl font-extrabold text-charcoal">{t.quantity}</p>
            <p className="text-xs text-muted">magnets</p>
            <p className="mt-1 sm:mt-1.5 font-semibold text-terracotta">{CURRENCY_SYMBOL}{t.price}</p>
            <p className="text-[10px] text-muted">{CURRENCY_SYMBOL}{t.perPiece}/each</p>
          </button>
        ))}
      </div>
      <div className={`mt-3 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 rounded-xl border p-4 ${isCustom ? "border-terracotta bg-terracotta/10 ring-2 ring-terracotta/30" : "border-line bg-surface"}`}>
        <div>
          <p className="text-sm font-semibold text-charcoal">Need more than 18?</p>
          <p className="text-xs text-muted">Add up to {MAX_QUANTITY} — each extra magnet just {CURRENCY_SYMBOL}{EXTRA_MAGNET_PRICE}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCustomQuantity((isCustom ? quantity : 19) - 1)}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-line bg-surface text-lg hover:bg-cream shrink-0">−</button>
          <input type="number" min={19} max={MAX_QUANTITY} value={isCustom ? quantity : ""}
            placeholder="19+" onChange={(e) => setCustomQuantity(Number(e.target.value))}
            className="input w-16 sm:w-20 text-center" />
          <button type="button" onClick={() => setCustomQuantity((isCustom ? quantity : 18) + 1)}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-line bg-surface text-lg hover:bg-cream shrink-0">+</button>
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-xl border border-line bg-cream/60 px-4 py-3 text-sm">
        <span className="text-muted">{quantityLabel(quantity)}</span>
        <span className="font-semibold text-terracotta whitespace-nowrap">
          {CURRENCY_SYMBOL}{pricing.total}
        </span>
      </div>
    </section>
  );
}

// An uploaded photo tile: gold shimmer until the image has actually painted.
function PhotoTile({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <div className="shimmer absolute inset-0" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}

// A photo that is still being optimised / uploaded: its own preview, dimmed,
// under a gold shimmer with a live progress bar.
function PendingTile({ p }: { p: PendingUpload }) {
  const pct = Math.round(p.progress * 100);
  return (
    <div className="shimmer relative aspect-square overflow-hidden rounded-xl border border-terracotta/30">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.preview} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 blur-[1px]" />
      <div className="absolute inset-x-0 bottom-0 p-1.5">
        <p className="mb-1 text-center text-[10px] font-semibold text-white drop-shadow">
          {p.stage === "optimising" ? "Optimising…" : pct >= 100 ? "Finishing…" : `Uploading ${pct}%`}
        </p>
        <div className="h-1 overflow-hidden rounded-full bg-[#110d0a]/60">
          <div
            className="h-full rounded-full bg-terracotta transition-[width] duration-300"
            style={{ width: `${p.stage === "optimising" ? 6 : Math.max(8, pct)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Step2({ quantity, images, uploading, pending, display, remaining, needsLogin,
  user, loading, fileRef, openPicker, removeImage, useForAll, handleFiles, clearAll }: {
  quantity: number; images: string[]; uploading: boolean; pending: PendingUpload[];
  display: (url: string) => string;
  remaining: number; needsLogin: boolean; user: boolean; loading: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>; openPicker: () => void;
  removeImage: (i: number) => void; useForAll: (url: string) => void;
  handleFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearAll: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const pendingCount = pending.length;
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-terracotta">2. Upload your photos</h2>
        <span className="rounded-full bg-cream px-3 py-0.5 text-xs font-medium text-muted">
          {images.length}/{quantity} added{remaining > 0 ? ` · ${remaining} to go` : " · all set ✓"}
        </span>
      </div>

      {!loading && !user && needsLogin && (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-terracotta/40 bg-terracotta/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-terracotta-dark">
            ⚠ Please sign in first to upload your photos.
          </p>
          <div className="flex gap-2">
            <Link href={`/signin?redirect=${PRODUCT_PATH}`}
              className="rounded-full bg-terracotta px-4 py-2 text-xs font-semibold text-onaccent">Sign in</Link>
            <Link href={`/signup?redirect=${PRODUCT_PATH}`}
              className="rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-charcoal">Create account</Link>
          </div>
        </div>
      )}

      {/* Mobile: preview stays hidden until the customer asks for it. */}
      <div className="mt-4 lg:hidden">
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          aria-expanded={showPreview}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-terracotta/40 bg-surface px-4 py-3 text-sm font-semibold text-charcoal transition-colors hover:border-terracotta"
        >
          <span className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-terracotta">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {showPreview ? "Hide preview" : "Preview your magnets in 3D"}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`text-muted transition-transform ${showPreview ? "rotate-180" : ""}`}>
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {showPreview && (
          <div className="mt-3">
            <ProductImageCarousel images={images.map(display)} quantity={quantity} uploading={uploading} />
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: quantity }).map((_, i) => {
          const url = images[i];
          const queued = !url ? pending[i - images.length] : undefined;
          if (queued) return <PendingTile key={queued.id} p={queued} />;
          if (url) return (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border-2 border-terracotta/30 bg-cream shadow-sm">
              <PhotoTile src={display(url)} alt={`Photo ${i + 1}`} />
              <span className="absolute left-1 top-1 rounded-md bg-[#340d00]/65 px-1.5 py-0.5 text-[10px] font-medium text-white">#{i + 1}</span>
              <button type="button" onClick={() => removeImage(i)} aria-label={`Remove ${i + 1}`}
                className="absolute right-1 top-1 grid h-6 w-6 cursor-pointer place-items-center rounded-md bg-[#340d00]/65 text-white hover:bg-red-600 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
              {quantity > 1 && (
                <button type="button" onClick={() => useForAll(url)}
                  className="absolute inset-x-0 bottom-0 bg-[#340d00]/75 py-1 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  Use for all
                </button>
              )}
            </div>
          );
          return (
            <button key={i} type="button" onClick={openPicker}
              className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line bg-surface text-muted hover:border-terracotta/60 hover:text-terracotta transition-colors">
              <span className="text-center text-xs"><span className="block text-xl font-bold">+</span>Add</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
        <button type="button" onClick={openPicker} disabled={remaining - pendingCount <= 0}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-charcoal hover:bg-cream disabled:opacity-50 transition-colors whitespace-nowrap">
          {uploading && <Spinner />}
          {uploading ? `Uploading ${pendingCount > 1 ? `${pendingCount} photos` : "photo"}…` : "📁 Upload photos"}
        </button>
        {images.length > 0 && quantity > 1 && (
          <button type="button" onClick={() => useForAll(images[0])}
            className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-charcoal hover:bg-cream transition-colors whitespace-nowrap">
            Use #1 for all {quantity}
          </button>
        )}
        {images.length > 0 && (
          <button type="button" onClick={clearAll}
            className="cursor-pointer text-xs text-muted hover:text-red-500 transition-colors whitespace-nowrap">Clear all</button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">JPG, PNG or WebP · pick multiple at once</p>
    </section>
  );
}

function Step3({ address, updateAddress, note, setNote }: {
  address: { fullName: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string };
  updateAddress: (f: "fullName"|"phone"|"line1"|"line2"|"city"|"state"|"pincode", v: string) => void;
  note: string; setNote: (s: string) => void;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-terracotta">3. Shipping details</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Full name" className="col-span-2 sm:col-span-1">
          <input value={address.fullName} onChange={(e) => updateAddress("fullName", e.target.value)} className="input" placeholder="Your full name" />
        </Field>
        <Field label="Phone" className="col-span-2 sm:col-span-1">
          <input value={address.phone} onChange={(e) => updateAddress("phone", e.target.value)} className="input" placeholder="10-digit mobile" />
        </Field>
        <Field label="Address line 1" className="col-span-2">
          <input value={address.line1} onChange={(e) => updateAddress("line1", e.target.value)} className="input" placeholder="House no., street" />
        </Field>
        <Field label="Landmark / area (optional)" className="col-span-2">
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
  );
}

function PaymentMethodStep({ paymentMethod, setPaymentMethod, codFee }: {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  codFee: number;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-terracotta">4. Payment method</h2>
      <div className="mt-3 space-y-2 sm:space-y-3">
        <label className={`flex cursor-pointer items-center gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 transition-all ${
          paymentMethod === "online" ? "border-terracotta bg-terracotta/10 ring-2 ring-terracotta/30" : "border-line bg-surface hover:border-terracotta/50"
        }`}>
          <input
            type="radio"
            name="paymentMethod"
            value="online"
            checked={paymentMethod === "online"}
            onChange={() => setPaymentMethod("online")}
            className="h-4 w-4 accent-terracotta shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-charcoal text-sm sm:text-base">Online payment</p>
            <p className="text-xs text-muted">UPI, Cards, Net Banking · No extra charge</p>
          </div>
          <span className="hidden sm:inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
            Recommended
          </span>
        </label>

        <label className={`flex cursor-pointer items-center gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 transition-all ${
          paymentMethod === "cod" ? "border-terracotta bg-terracotta/10 ring-2 ring-terracotta/30" : "border-line bg-surface hover:border-terracotta/50"
        }`}>
          <input
            type="radio"
            name="paymentMethod"
            value="cod"
            checked={paymentMethod === "cod"}
            onChange={() => setPaymentMethod("cod")}
            className="h-4 w-4 accent-terracotta shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-charcoal text-sm sm:text-base">Cash on Delivery</p>
            <p className="text-xs text-muted">
              Pay when you receive · {codFee > 0 ? `${CURRENCY_SYMBOL}${codFee} handling charge` : "no extra charge"}
            </p>
          </div>
        </label>
      </div>
    </section>
  );
}

function OrderSummary({ pricing, quantity, submitting, uploading, user, error, onPay, paymentMethod, codFee,
  couponInput, setCouponInput, appliedCoupon, couponError, couponLoading, applyCoupon, removeCoupon }: {
  pricing: { subtotal: number; gst: number; total: number };
  quantity: number; submitting: boolean; uploading: boolean; user: boolean; error: string;
  onPay: () => void;
  paymentMethod: PaymentMethod;
  codFee: number;
  couponInput: string;
  setCouponInput: (v: string) => void;
  appliedCoupon: { code: string; discount: number; finalTotal: number } | null;
  couponError: string;
  couponLoading: boolean;
  applyCoupon: () => void;
  removeCoupon: () => void;
}) {
  const isCod = paymentMethod === "cod";
  const afterDiscount = appliedCoupon ? appliedCoupon.finalTotal : pricing.total;
  const payable = afterDiscount + (isCod ? codFee : 0);
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-sm">
      <h3 className="mb-3 text-sm sm:text-base font-semibold text-charcoal">Order summary</h3>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted text-xs sm:text-sm">{quantityLabel(quantity)}</span>
        <span className="font-medium text-charcoal">{CURRENCY_SYMBOL}{pricing.subtotal}</span>
      </div>

      {/* Coupon code */}
      <div className="mt-3 sm:mt-4 border-t border-line pt-3 sm:pt-4">
        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">{appliedCoupon.code}</span>
              <span className="ml-2 text-emerald-600 dark:text-emerald-300">applied</span>
            </div>
            <button type="button" onClick={removeCoupon}
              className="cursor-pointer text-xs font-medium text-muted hover:text-red-500">
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
              placeholder="Coupon code"
              className="input flex-1 text-sm"
            />
            <button type="button" onClick={applyCoupon} disabled={couponLoading}
              className="cursor-pointer rounded-full border border-terracotta bg-surface px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-terracotta hover:bg-terracotta/10 disabled:opacity-60 whitespace-nowrap">
              {couponLoading ? "…" : "Apply"}
            </button>
          </div>
        )}
        {couponError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{couponError}</p>}
      </div>

      {appliedCoupon && (
        <div className="mt-2 sm:mt-3 flex items-center justify-between text-xs sm:text-sm">
          <span className="text-emerald-700 dark:text-emerald-400">Discount</span>
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            &minus;{CURRENCY_SYMBOL}{appliedCoupon.discount}
          </span>
        </div>
      )}

      {isCod && codFee > 0 && (
        <div className="mt-2 sm:mt-3 flex items-center justify-between text-xs sm:text-sm">
          <span className="text-muted">COD handling</span>
          <span className="font-medium text-charcoal">+{CURRENCY_SYMBOL}{codFee}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="font-semibold text-charcoal text-sm sm:text-base">Total payable</span>
        <span className="text-xl sm:text-2xl font-extrabold text-terracotta">{CURRENCY_SYMBOL}{payable}</span>
      </div>

      {error && <p className="mt-3 sm:mt-4 rounded-lg bg-red-500/10 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="button"
        onClick={onPay}
        disabled={submitting || uploading || !user}
        className="mt-3 sm:mt-4 w-full cursor-pointer rounded-full bg-terracotta px-5 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-onaccent shadow-md transition-colors hover:bg-terracotta-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {!user ? "Sign in to place order"
          : submitting ? (isCod ? "Placing order…" : "Processing payment…")
          : isCod ? `Place Order (COD) · ${CURRENCY_SYMBOL}${payable}`
          : `Pay ${CURRENCY_SYMBOL}${payable} · Razorpay`}
      </button>

      {/* Trust badges */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[13px] sm:h-[13px]">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          100% secure
        </span>
        {!isCod && (
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[13px] sm:h-[13px]">
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <path d="M1 10h22" />
            </svg>
            UPI / Card / Net banking
          </span>
        )}
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[13px] sm:h-[13px]">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Instant confirmation
        </span>
      </div>

      {/* Payment provider branding */}
      {!isCod && (
        <p className="mt-2 text-center text-[10px] text-muted/70">
          Powered by{" "}
          <span className="font-semibold text-[#072654] dark:text-[#9db8ff]">Razorpay</span>
          &nbsp;· Your payment is encrypted &amp; secure
        </p>
      )}
    </div>
  );
}

function Field({ label, className = "", children }: {
  label: string; className?: string; children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
// ---- Customer Reviews Section ----

function CustomerReviews() {
  return (
    <section className="mt-16 border-t border-line pt-10">
      <CustomerLove />

      <div className="mt-8 grid grid-cols-1 xs:grid-cols-2 gap-3 rounded-2xl border border-line bg-cream/60 p-4 sm:p-5 sm:grid-cols-4">
        {[
          { label: "Free shipping", sub: "On all orders" },
          { label: "Pay on delivery", sub: "No extra charge" },
          { label: "Made with care", sub: "Printed & packed by hand" },
          { label: "Easy returns", sub: "Damaged? We'll replace it" },
        ].map((b) => (
          <div key={b.label} className="flex flex-col">
            <span className="text-sm font-semibold text-charcoal">{b.label}</span>
            <span className="text-xs text-muted">{b.sub}</span>
          </div>
        ))}
      </div>

      {/* <BannerCarousel /> */}
    </section>
  );
}
