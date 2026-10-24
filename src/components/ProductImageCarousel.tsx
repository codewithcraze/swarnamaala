"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

// WebGL magnet — browser-only, loaded only when the 3D view is opened.
const MagnetScene = dynamic(() => import("./MagnetScene"), { ssr: false, loading: () => null });

// Uploaded photos are served by our own /api/images proxy. Use the same-origin
// path so the 3D texture can be read (cross-origin images can't be used in WebGL).
function sameOrigin(url: string) {
  const i = url.indexOf("/api/images/");
  return i >= 0 ? url.slice(i) : url;
}

// Instant local previews (blob: URLs) can't go through the image optimiser.
const isLocal = (url: string | null) => !!url && url.startsWith("blob:");

type Props = {
  images: string[];        // uploaded URLs
  quantity: number;        // total slots in the pack
  uploading: boolean;
  placeholder?: string;    // path to placeholder image
};

export default function ProductImageCarousel({
  images,
  quantity,
  uploading,
  // Sample magnet photo shown in every slot until the customer uploads their own.
  placeholder = "/showcase.jpg",
}: Props) {
  const [active, setActive] = useState(0);
  // 3D is the default view; customers can switch to the flat photo.
  const [view3d, setView3d] = useState(true);

  // Slots: filled slots use real image, empty slots use placeholder
  const slots = Array.from({ length: Math.max(quantity, 1) }, (_, i) => ({
    url: images[i] ?? null,
    index: i,
  }));

  // Clamp active index when quantity drops
  const safeActive = Math.min(active, slots.length - 1);
  const current = slots[safeActive];

  function prevSlide() {
    setActive((a) => (a - 1 + slots.length) % slots.length);
  }
  function nextSlide() {
    setActive((a) => (a + 1) % slots.length);
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-line bg-surface p-4 shadow-sm">
      {/* Photo / 3D switch */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex rounded-full border border-line p-0.5 text-xs font-semibold" role="tablist">
          {[
            { id: false, label: "Photo" },
            { id: true, label: "3D view" },
          ].map((t) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={view3d === t.id}
              onClick={() => setView3d(t.id)}
              className={`rounded-full px-3.5 py-1.5 transition-colors ${
                view3d === t.id ? "bg-terracotta text-onaccent" : "text-muted hover:text-charcoal"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {view3d && <span className="text-[11px] text-muted">Drag to turn it over</span>}
      </div>

      {view3d ? (
        // 3D magnet: drag / swipe in any direction, double-tap to reset.
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-cream">
          <div className="absolute inset-0">
            <MagnetScene image={current.url ? sameOrigin(current.url) : placeholder} />
          </div>
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-[#110d0a]/75 px-3 py-1 text-xs font-semibold text-white">
            {safeActive + 1} / {slots.length}
          </span>
        </div>
      ) : (
      /* Main view — shaped like the real 90mm x 65mm magnet, sharp corners */
      <div className="relative aspect-[90/65] w-full overflow-hidden bg-cream shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
        <Image
          src={current.url ?? placeholder}
          alt={current.url ? `Magnet ${safeActive + 1}` : "Sample magnet — upload your photo to replace it"}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 450px"
          unoptimized={isLocal(current.url)}
          priority
        />

        {/* Thin magnet edge */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_2px_rgba(201,161,74,0.35)]" />

        {/* Uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <svg className="h-8 w-8 animate-spin text-terracotta" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-medium text-charcoal">Uploading…</span>
            </div>
          </div>
        )}

        {/* Slot badge */}
        <span className="absolute left-3 top-3 rounded-full bg-[#340d00]/65 px-3 py-1 text-xs font-semibold text-white">
          {safeActive + 1} / {slots.length}
        </span>

        {/* Sample label — small, so the magnet itself stays the focus */}
        {!current.url && !uploading && (
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#110d0a]/75 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            Sample · your photo goes here
          </span>
        )}

        {/* Prev / Next arrows — only show when there are multiple slots */}
        {slots.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous magnet"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-surface/90 p-1.5 shadow transition hover:bg-surface"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next magnet"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-surface/90 p-1.5 shadow transition hover:bg-surface"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>
      )}

      {/* Thumbnail strip */}
      {slots.length > 1 && (
        <div className="no-scrollbar mt-3 flex w-full min-w-0 gap-2 overflow-x-auto pb-1">
          {slots.map((slot, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View magnet ${i + 1}`}
              className={`relative h-12 w-[66px] shrink-0 overflow-hidden border-2 transition-all ${
                i === safeActive
                  ? "border-terracotta shadow-sm"
                  : "border-line hover:border-terracotta/50"
              }`}
            >
              <Image
                src={slot.url ?? placeholder}
                alt={slot.url ? `Thumbnail ${i + 1}` : `Sample for magnet ${i + 1}`}
                fill
                className={`object-cover ${slot.url ? "opacity-100" : "opacity-60"}`}
                sizes="66px"
                unoptimized={isLocal(slot.url)}
              />
            </button>
          ))}
        </div>
      )}

      {/* Tagline */}
      <p className="mt-4 text-center text-xs text-muted">
        Glossy finish · Strong magnetic grip · Pan-India delivery
      </p>
    </div>
  );
}
