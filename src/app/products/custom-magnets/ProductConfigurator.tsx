"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ProductImageCarousel from "@/components/ProductImageCarousel";
import BannerCarousel from "@/components/BannerCarousel";
import { openRazorpayCheckout } from "@/lib/razorpay";
import {
  PRICING_TIERS, getTier, computePricing, quantityLabel,
  CURRENCY_SYMBOL, EXTRA_MAGNET_PRICE, MAX_QUANTITY, COD_FEE,
} from "@/lib/pricing";

type PaymentMethod = "online" | "cod";

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
    if (!user) { setNeedsLogin(true); return; }
    const slots = quantity - images.length;
    if (slots <= 0) { setError(`All ${quantity} photos added.`); return; }
    const toUpload = files.slice(0, slots);
    setUploading(true);
    setPendingCount(toUpload.length);
    try {
      const results = await Promise.allSettled(toUpload.map(uploadFile));
      const urls = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
        .map((r) => r.value);
      if (urls.length > 0) setImages((prev) => [...prev, ...urls].slice(0, quantity));
      if (results.some((r) => r.status === "rejected"))
        setError("Some photos failed to upload. Please try again.");
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
              className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-white whitespace-nowrap">
              Sign in
            </Link>
            <Link href={`/signup?redirect=${PRODUCT_PATH}`}
              className="rounded-full border border-line bg-white px-5 py-2 text-sm font-semibold text-charcoal whitespace-nowrap">
              Create account
            </Link>
          </div>
        </div>
      )}

      <div className="lg:grid  lg:gap-10 lg:grid-cols-[1fr_min(450px,_40%)]">
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
                        ${isDone ? "bg-terracotta text-white" : isActive ? "border-2 border-terracotta bg-white text-terracotta" : "border border-line bg-white text-muted"}`}>
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
              pendingCount={pendingCount} remaining={remaining} needsLogin={needsLogin}
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
              <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <button type="button" onClick={handleBack} disabled={step === 1}
                className="cursor-pointer rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-cream disabled:invisible">
                ← Back
              </button>
              {step !== 4 ? (
                <button type="button" onClick={handleNext} disabled={uploading}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-terracotta px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-terracotta-dark disabled:opacity-60 whitespace-nowrap">
                  {uploading && <Spinner />}
                  {uploading ? `Uploading ${pendingCount > 1 ? `${pendingCount} photos` : "photo"}…` : "Continue →"}
                </button>
              ) : null}
            </div>
          </form>

          <CustomerReviews />
        </div>

        {/* RIGHT: carousel (desktop sticky, hidden on mobile) */}
        <aside className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
          <ProductImageCarousel images={images} quantity={quantity} uploading={uploading} />
          <div className="mt-4 rounded-2xl border border-line bg-cream/60 p-4 text-sm text-muted">
            <p className="font-semibold text-charcoal">Have questions?</p>
            <p className="mt-1">Chat with us on WhatsApp for instant help.</p>
            <a href="https://wa.me/919084248821" target="_blank" rel="noopener noreferrer"
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
      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {PRICING_TIERS.map((t) => (
          <button key={t.quantity} type="button" onClick={() => setQuantity(t.quantity)}
            className={`relative rounded-xl border p-3 sm:p-4 text-center cursor-pointer transition-all ${
              quantity === t.quantity ? "border-terracotta bg-terracotta/10 ring-2 ring-terracotta/30" : "border-line bg-white hover:border-terracotta/50"
            }`}>
            {t.badge && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-terracotta px-2 sm:px-2.5 py-0.5 text-[10px] font-semibold text-white">
                {t.badge}
              </span>
            )}
            <p className="text-xl sm:text-2xl font-extrabold text-charcoal">{t.quantity}</p>
            <p className="text-xs text-muted">{t.quantity === 1 ? "magnet" : "magnets"}</p>
            <p className="mt-1 sm:mt-1.5 font-semibold text-terracotta">{CURRENCY_SYMBOL}{t.price}</p>
            <p className="text-[10px] text-muted">{CURRENCY_SYMBOL}{t.perPiece}/each</p>
          </button>
        ))}
      </div>
      <div className={`mt-3 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 rounded-xl border p-4 ${isCustom ? "border-terracotta bg-terracotta/10 ring-2 ring-terracotta/30" : "border-line bg-white"}`}>
        <div>
          <p className="text-sm font-semibold text-charcoal">Need more than 10?</p>
          <p className="text-xs text-muted">Each extra magnet just {CURRENCY_SYMBOL}{EXTRA_MAGNET_PRICE}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCustomQuantity((isCustom ? quantity : 12) - 1)}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-line bg-white text-lg hover:bg-cream shrink-0">−</button>
          <input type="number" min={11} max={MAX_QUANTITY} value={isCustom ? quantity : ""}
            placeholder="11+" onChange={(e) => setCustomQuantity(Number(e.target.value))}
            className="input w-16 sm:w-20 text-center" />
          <button type="button" onClick={() => setCustomQuantity((isCustom ? quantity : 10) + 1)}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-line bg-white text-lg hover:bg-cream shrink-0">+</button>
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

function Step2({ quantity, images, uploading, pendingCount, remaining, needsLogin,
  user, loading, fileRef, openPicker, removeImage, useForAll, handleFiles, clearAll }: {
  quantity: number; images: string[]; uploading: boolean; pendingCount: number;
  remaining: number; needsLogin: boolean; user: boolean; loading: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>; openPicker: () => void;
  removeImage: (i: number) => void; useForAll: (url: string) => void;
  handleFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearAll: () => void;
}) {
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
              className="rounded-full bg-terracotta px-4 py-2 text-xs font-semibold text-white">Sign in</Link>
            <Link href={`/signup?redirect=${PRODUCT_PATH}`}
              className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-charcoal">Create account</Link>
          </div>
        </div>
      )}

      {/* Mobile carousel preview */}
      <div className="mt-4 lg:hidden">
        <ProductImageCarousel images={images} quantity={quantity} uploading={uploading} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: quantity }).map((_, i) => {
          const url = images[i];
          const isQueued = !url && i < images.length + pendingCount;
          if (isQueued) return (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-line bg-cream">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-cream via-white to-cream" />
              <div className="absolute inset-0 grid place-items-center">
                <Spinner />
              </div>
            </div>
          );
          if (url) return (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border-2 border-terracotta/30 bg-cream shadow-sm">
              <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 120px" />
              <span className="absolute left-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">#{i + 1}</span>
              <button type="button" onClick={() => removeImage(i)} aria-label={`Remove ${i + 1}`}
                className="absolute right-1 top-1 grid h-6 w-6 cursor-pointer place-items-center rounded-md bg-black/60 text-white hover:bg-red-600 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
              {quantity > 1 && (
                <button type="button" onClick={() => useForAll(url)}
                  className="absolute inset-x-0 bottom-0 bg-black/65 py-1 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  Use for all
                </button>
              )}
            </div>
          );
          return (
            <button key={i} type="button" onClick={openPicker} disabled={uploading}
              className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line bg-white text-muted hover:border-terracotta/60 hover:text-terracotta disabled:opacity-60 transition-colors">
              <span className="text-center text-xs"><span className="block text-xl font-bold">+</span>Add</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
        <button type="button" onClick={openPicker} disabled={uploading || remaining <= 0}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-charcoal hover:bg-cream disabled:opacity-50 transition-colors whitespace-nowrap">
          {uploading && <Spinner />}
          {uploading ? `Uploading ${pendingCount > 1 ? `${pendingCount} photos` : "photo"}…` : "📁 Upload photos"}
        </button>
        {images.length > 0 && quantity > 1 && (
          <button type="button" onClick={() => useForAll(images[0])}
            className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-charcoal hover:bg-cream transition-colors whitespace-nowrap">
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
          paymentMethod === "online" ? "border-terracotta bg-terracotta/10 ring-2 ring-terracotta/30" : "border-line bg-white hover:border-terracotta/50"
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
          <span className="hidden sm:inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 whitespace-nowrap">
            Recommended
          </span>
        </label>

        <label className={`flex cursor-pointer items-center gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 transition-all ${
          paymentMethod === "cod" ? "border-terracotta bg-terracotta/10 ring-2 ring-terracotta/30" : "border-line bg-white hover:border-terracotta/50"
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
            <p className="text-xs text-muted">Pay when you receive · {CURRENCY_SYMBOL}{codFee} handling charge</p>
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
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-sm">
      <h3 className="mb-3 text-sm sm:text-base font-semibold text-charcoal">Order summary</h3>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted text-xs sm:text-sm">{quantityLabel(quantity)}</span>
        <span className="font-medium text-charcoal">{CURRENCY_SYMBOL}{pricing.subtotal}</span>
      </div>

      {/* Coupon code */}
      <div className="mt-3 sm:mt-4 border-t border-line pt-3 sm:pt-4">
        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-emerald-700">{appliedCoupon.code}</span>
              <span className="ml-2 text-emerald-600">applied</span>
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
              className="cursor-pointer rounded-full border border-terracotta bg-white px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-terracotta hover:bg-terracotta/10 disabled:opacity-60 whitespace-nowrap">
              {couponLoading ? "…" : "Apply"}
            </button>
          </div>
        )}
        {couponError && <p className="mt-2 text-xs text-red-600">{couponError}</p>}
      </div>

      {appliedCoupon && (
        <div className="mt-2 sm:mt-3 flex items-center justify-between text-xs sm:text-sm">
          <span className="text-emerald-700">Discount</span>
          <span className="font-medium text-emerald-700">
            &minus;{CURRENCY_SYMBOL}{appliedCoupon.discount}
          </span>
        </div>
      )}

      {isCod && (
        <div className="mt-2 sm:mt-3 flex items-center justify-between text-xs sm:text-sm">
          <span className="text-muted">COD handling</span>
          <span className="font-medium text-charcoal">+{CURRENCY_SYMBOL}{codFee}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="font-semibold text-charcoal text-sm sm:text-base">Total payable</span>
        <span className="text-xl sm:text-2xl font-extrabold text-terracotta">{CURRENCY_SYMBOL}{payable}</span>
      </div>

      {error && <p className="mt-3 sm:mt-4 rounded-lg bg-red-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onPay}
        disabled={submitting || uploading || !user}
        className="mt-3 sm:mt-4 w-full cursor-pointer rounded-full bg-terracotta px-5 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-md transition-colors hover:bg-terracotta-dark disabled:cursor-not-allowed disabled:opacity-60"
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
          <span className="font-semibold text-[#072654]">Razorpay</span>
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

const CUSTOMER_REVIEWS = [
  {
    name: "Priyanka Thankur",
    location: "Greater Noida",
    rating: 5,
    text: "Very Nice, Product print is too good.",
    photo: "/feedback/customer4.jpeg",
    verified: true,
  },
   {
    name: "Deepak Chaudhary",
    location: "Noida",
    rating: 5,
    text: "Picture are so good. I asked them to create with different shapes and with resin work. Product deliverd is also good.",
    photo: "/feedback/customer3.jpeg",
    verified: true,
  },
  {
    name: "Priya S.",
    location: "Mumbai",
    rating: 5,
    text: "The print quality blew me away — colors are exactly like the original photo. Fridge looks so much happier now!",
    photo: "/feedback/customer.png",
    verified: true,
  },
  {
    name: "Rohit K.",
    location: "Bengaluru",
    rating: 5,
    text: "Ordered a 9-pack for my parents' anniversary. Packaging was solid and delivery was faster than expected.",
    photo: "/feedback/customer2.png",
    verified: true,
  },
   
];

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i < Math.round(rating) ? "currentColor" : "none"}
          stroke="currentColor" strokeWidth="1.5"
          className={i < Math.round(rating) ? "text-[#F4B942]" : "text-line"}>
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}

function CustomerReviews() {
  const avg = CUSTOMER_REVIEWS.reduce((s, r) => s + r.rating, 0) / CUSTOMER_REVIEWS.length;
  return (
    <section className="mt-16 border-t border-line pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-charcoal">Loved by 2,000+ happy customers</h2>
          <div className="mt-1.5 flex items-center gap-2">
            <Stars rating={avg} size={16} />
            <span className="text-sm font-semibold text-charcoal">{avg.toFixed(1)}</span>
            <span className="text-xs sm:text-sm text-muted">out of 5 · based on 500+ reviews</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted">Real photos from real orders — see the quality before you buy.</p>
      </div>

      <div className="mt-6 -mx-4 flex snap-x snap-mandatory gap-3 sm:gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-2">
        {CUSTOMER_REVIEWS.map((r, i) => (
          <div key={i} className="w-[75%] sm:w-auto shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="relative aspect-square w-full overflow-hidden bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.photo} alt={`Magnets received by ${r.name}`} className="h-full w-full object-cover" loading="lazy" />
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
              <p className="mt-3 text-xs font-semibold text-muted">{r.name} <span className="font-normal">· {r.location}</span></p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 xs:grid-cols-2 gap-3 rounded-2xl border border-line bg-cream/60 p-4 sm:p-5 sm:grid-cols-4">
        {[
          { label: "Free shipping", sub: "On all orders" },
          { label: "Pay on delivery", sub: "No advance needed" },
          { label: "Made with care", sub: "Printed & packed by hand" },
          { label: "Easy returns", sub: "Damaged? We'll replace it" },
        ].map((b) => (
          <div key={b.label} className="flex flex-col">
            <span className="text-sm font-semibold text-charcoal">{b.label}</span>
            <span className="text-xs text-muted">{b.sub}</span>
          </div>
        ))}
      </div>

      <BannerCarousel />
    </section>
  );
}
