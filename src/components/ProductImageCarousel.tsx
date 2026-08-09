"use client";

import { useState } from "react";
import Image from "next/image";

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
  placeholder = "/placeholder.png",
}: Props) {
  const [active, setActive] = useState(0);

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
    <div className="sticky top-24 rounded-3xl border border-line bg-white p-4 shadow-sm">
      {/* Main view */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-cream">
        <Image
          src={current.url ?? placeholder}
          alt={current.url ? `Magnet ${safeActive + 1}` : "Upload your photo here"}
          fill
          className={`object-cover transition-opacity duration-300 ${
            current.url ? "opacity-100" : "opacity-40"
          }`}
          sizes="(max-width: 768px) 100vw, 450px"
        />

        {/* Magnet frame overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_6px_rgba(217,119,87,0.3)]" />

        {/* Uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
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
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
          {safeActive + 1} / {slots.length}
        </span>

        {/* Empty-slot hint */}
        {!current.url && !uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="m3 15 4-4 4 4 4-5 6 7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8.5" cy="8.5" r="1.5" />
            </svg>
            <span className="text-xs">Magnet {safeActive + 1} — add photo</span>
          </div>
        )}

        {/* Prev / Next arrows — only show when there are multiple slots */}
        {slots.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous magnet"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow transition hover:bg-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next magnet"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow transition hover:bg-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {slots.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {slots.map((slot, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View magnet ${i + 1}`}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                i === safeActive
                  ? "border-terracotta shadow-sm"
                  : "border-line hover:border-terracotta/50"
              }`}
            >
              <Image
                src={slot.url ?? placeholder}
                alt={slot.url ? `Thumbnail ${i + 1}` : `Empty slot ${i + 1}`}
                fill
                className={`object-cover ${slot.url ? "opacity-100" : "opacity-30"}`}
                sizes="56px"
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
