"use client";

import { useEffect, useRef, useState } from "react";
import Confetti from "@/components/Confetti";
import { compressImage, uploadWithProgress, runLimited } from "@/lib/compressImage";
import { PLATFORMS, MAX_MARKETPLACE_QTY, type PlatformId } from "@/lib/platforms";

type Pending = { id: string; preview: string; progress: number; stage: "optimising" | "uploading" };
type Photo = { url: string; preview: string };

const STEPS = ["Your order", "Photos", "Done"];

// Public page for customers who bought on Meesho / Flipkart / Amazon etc.
// 1) name, email, platform + order id  →  2) choose count, upload photos  →  3) done.
export default function SendPhotosClient() {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [token, setToken] = useState("");

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [platform, setPlatform] = useState<PlatformId>("meesho");
  const [externalOrderId, setExternalOrderId] = useState("");
  const [checking, setChecking] = useState(false);

  // Step 2
  const [count, setCount] = useState(1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ accountCreated: boolean; emailSent: boolean } | null>(null);

  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Free local previews when leaving the page.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const uploading = pending.length > 0;
  const filled = photos.length;
  const free = count - filled - pending.length;

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setChecking(true);
    try {
      const res = await fetch("/api/marketplace/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, platform, externalOrderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Please check your details.");
      setToken(data.token);
      setExternalOrderId(data.externalOrderId);
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please check your details.");
    } finally {
      setChecking(false);
    }
  }

  function changeCount(n: number) {
    const v = Math.max(1, Math.min(MAX_MARKETPLACE_QTY, Math.floor(n || 1)));
    setCount(v);
    // Shrinking below the photos already added drops the extras.
    setPhotos((list) => (list.length > v ? list.slice(0, v) : list));
  }

  async function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setError("");
    if (free <= 0) {
      setError(`All ${count} photos are added. Increase the number of magnets to add more.`);
      return;
    }
    const items = files.slice(0, free).map((file, i) => ({
      file,
      p: { id: `${Date.now()}-${i}`, preview: URL.createObjectURL(file), progress: 0, stage: "optimising" as const },
    }));
    setPending((l) => [...l, ...items.map((x) => x.p)]);
    const patch = (id: string, v: Partial<Pending>) => setPending((l) => l.map((p) => (p.id === id ? { ...p, ...v } : p)));

    let failed = 0;
    await runLimited(items, 3, async ({ file, p }) => {
      try {
        const small = await compressImage(file);
        patch(p.id, { stage: "uploading" });
        const url = await uploadWithProgress(small, (f) => patch(p.id, { progress: f }), token);
        setPhotos((list) => [...list, { url, preview: p.preview }]);
      } catch {
        failed++;
        URL.revokeObjectURL(p.preview);
      } finally {
        setPending((l) => l.filter((x) => x.id !== p.id));
      }
    });
    if (failed) setError(`${failed} ${failed === 1 ? "photo" : "photos"} failed to upload. Please try again.`);
  }

  function removePhoto(i: number) {
    setPhotos((list) => list.filter((_, k) => k !== i));
  }

  function useForAll(i: number) {
    setPhotos((list) => Array.from({ length: count }, () => list[i]));
  }

  async function submit() {
    setError("");
    if (filled !== count) {
      setError(`Please add ${count} ${count === 1 ? "photo" : "photos"} — one for each magnet.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/marketplace/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ images: photos.map((p) => p.url), note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send your photos.");
      setResult({ accountCreated: data.accountCreated, emailSent: data.emailSent });
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your photos.");
    } finally {
      setSubmitting(false);
    }
  }

  const btn =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50";
  const platformName = PLATFORMS.find((p) => p.id === platform)?.label ?? "";

  return (
    <div className="mx-auto max-w-[760px] px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      {step === 2 && <Confetti />}

      <header className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-terracotta">Bought on a marketplace?</p>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-charcoal sm:text-[36px]">
          Send us your photos
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">
          Ordered on Meesho, Flipkart, Amazon or elsewhere? Add your order ID and upload your photos. No sign-up needed.
        </p>
      </header>

      {/* Stepper */}
      <ol className="mb-8 flex items-center justify-center gap-2 text-sm">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                i < step ? "bg-terracotta text-onaccent" : i === step ? "border-2 border-terracotta text-terracotta" : "border border-line text-muted"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className={i === step ? "font-semibold text-charcoal" : "text-muted"}>{s}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-0.5 w-6 rounded bg-line sm:w-10" />}
          </li>
        ))}
      </ol>

      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* STEP 1 — details */}
      {step === 0 && (
        <form onSubmit={start} className="rounded-[22px] border border-line bg-surface p-5 sm:p-7">
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-charcoal">Where did you buy?</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  aria-pressed={platform === p.id}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    platform === p.id ? "border-terracotta bg-terracotta/10 text-charcoal ring-2 ring-terracotta/30" : "border-line text-muted hover:text-charcoal"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label={`${platformName} order ID`} className="sm:col-span-2" hint="Find it in your order details on the app.">
              <input
                className="input font-mono uppercase"
                value={externalOrderId}
                onChange={(e) => setExternalOrderId(e.target.value)}
                placeholder="e.g. 123456789012345"
                required
                autoComplete="off"
              />
            </Field>
            <Field label="Full name">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </Field>
            <Field label="Email" hint="We'll send your order confirmation here.">
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </Field>
            <Field label="Phone (optional)" className="sm:col-span-2">
              <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" />
            </Field>
          </div>

          <button type="submit" disabled={checking} className={`${btn} mt-6 w-full bg-terracotta text-onaccent hover:bg-terracotta-dark`}>
            {checking ? "Checking…" : "Continue to photos →"}
          </button>
        </form>
      )}

      {/* STEP 2 — photos */}
      {step === 1 && (
        <section className="rounded-[22px] border border-line bg-surface p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-cream/60 px-4 py-3 text-sm">
            <span className="text-muted">
              {platformName} order <b className="font-mono text-charcoal">{externalOrderId}</b>
            </span>
            <button type="button" onClick={() => setStep(0)} className="text-xs font-semibold text-terracotta hover:underline">
              Change
            </button>
          </div>

          {/* Count */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-charcoal">How many magnets did you order?</p>
              <p className="text-xs text-muted">One photo per magnet · up to {MAX_MARKETPLACE_QTY}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => changeCount(count - 1)} disabled={count <= 1} aria-label="Fewer magnets"
                className="grid h-10 w-10 place-items-center rounded-lg border border-line text-lg text-charcoal hover:bg-cream disabled:opacity-40">−</button>
              <input
                type="number"
                min={1}
                max={MAX_MARKETPLACE_QTY}
                value={count}
                onChange={(e) => changeCount(Number(e.target.value))}
                aria-label="Number of magnets"
                className="input w-20 text-center text-base font-semibold"
              />
              <button type="button" onClick={() => changeCount(count + 1)} disabled={count >= MAX_MARKETPLACE_QTY} aria-label="More magnets"
                className="grid h-10 w-10 place-items-center rounded-lg border border-line text-lg text-charcoal hover:bg-cream disabled:opacity-40">+</button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-muted">
            <span>{filled}/{count} added{filled === count ? " · all set ✓" : ""}</span>
            {filled > 0 && (
              <button type="button" onClick={() => setPhotos([])} className="hover:text-red-500">Clear all</button>
            )}
          </div>

          {/* Grid of slots */}
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
            {Array.from({ length: count }).map((_, i) => {
              const ph = photos[i];
              const p = !ph ? pending[i - filled] : undefined;
              if (p) {
                const pct = Math.round(p.progress * 100);
                return (
                  <div key={p.id} className="shimmer relative aspect-square overflow-hidden rounded-xl border border-terracotta/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.preview} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
                    <div className="absolute inset-x-0 bottom-0 p-1.5">
                      <p className="mb-1 text-center text-[10px] font-semibold text-white drop-shadow">
                        {p.stage === "optimising" ? "Optimising…" : pct >= 100 ? "Finishing…" : `${pct}%`}
                      </p>
                      <div className="h-1 overflow-hidden rounded-full bg-black/40">
                        <div className="h-full rounded-full bg-terracotta transition-[width] duration-300" style={{ width: `${p.stage === "optimising" ? 6 : Math.max(8, pct)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              }
              if (ph) {
                return (
                  <div key={`${ph.url}-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border-2 border-terracotta/30 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ph.preview} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    <span className="absolute left-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">#{i + 1}</span>
                    <button type="button" onClick={() => removePhoto(i)} aria-label={`Remove photo ${i + 1}`}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-black/60 text-white hover:bg-red-600">×</button>
                    {count > 1 && (
                      <button type="button" onClick={() => useForAll(i)}
                        className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-[10px] font-medium text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                        Use for all
                      </button>
                    )}
                  </div>
                );
              }
              return (
                <button key={`empty-${i}`} type="button" onClick={() => fileRef.current?.click()}
                  className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-line text-muted transition-colors hover:border-terracotta/60 hover:text-terracotta">
                  <span className="text-center text-xs"><span className="block text-xl font-bold">+</span>Add</span>
                </button>
              );
            })}
          </div>

          <button type="button" onClick={() => fileRef.current?.click()} disabled={free <= 0}
            className={`${btn} mt-4 w-full border border-line text-charcoal hover:bg-cream`}>
            📁 {filled === 0 ? "Choose photos" : "Add more photos"}
          </button>
          <p className="mt-2 text-center text-xs text-muted">JPG, PNG or WebP · you can pick several at once</p>

          <label className="mt-6 block">
            <span className="mb-1 block text-xs font-medium text-muted">Note for us (optional)</span>
            <textarea className="input min-h-20 resize-y" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000}
              placeholder="e.g. crop photo 3 a little from the top" />
          </label>

          <button type="button" onClick={submit} disabled={submitting || uploading || filled !== count}
            className={`${btn} mt-6 w-full bg-terracotta py-3.5 text-base text-onaccent hover:bg-terracotta-dark`}>
            {submitting ? "Sending…" : uploading ? `Uploading ${pending.length}…` : `Send ${count} ${count === 1 ? "photo" : "photos"}`}
          </button>

          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addFiles} className="hidden" />
        </section>
      )}

      {/* STEP 3 — done */}
      {step === 2 && result && (
        <section className="rounded-[22px] border border-emerald-500/35 bg-surface p-6 text-center sm:p-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-2xl text-white">✓</div>
          <h2 className="mt-4 text-2xl font-bold text-charcoal">Photos received!</h2>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">
            Thanks {name.split(" ")[0]}. We&apos;ve got all {count} {count === 1 ? "photo" : "photos"} for {platformName} order{" "}
            <b className="font-mono text-charcoal">{externalOrderId}</b> and will start printing.
          </p>
          <p className="mx-auto mt-4 max-w-md rounded-xl border border-line bg-cream/60 px-4 py-3 text-sm text-muted">
            {!result.emailSent
              ? "We couldn't send the confirmation email right now, but your order is saved."
              : result.accountCreated
                ? `We've emailed ${email} a confirmation with a password, so you can sign in and track this order.`
                : `We've emailed a confirmation to ${email}. Sign in with that email to track this order.`}
          </p>
        </section>
      )}
    </div>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}
