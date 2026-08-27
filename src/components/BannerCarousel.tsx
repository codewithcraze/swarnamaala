"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

const BANNERS = [
  {
    src: "/banners/banner1.png",
    alt: "Your memories, our magnets — Packs from ₹99",
    cta: "Shop Now",
    href: "/products/custom-magnets",
  },
  {
    src: "/banners/banner2.png",
    alt: "Memories that stick — Custom magnets made just for you",
    cta: "Create Yours",
    href: "/products/custom-magnets",
  }
];

const INTERVAL = 4000;

export default function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const next = useCallback(() =>
    setCurrent((c) => (c + 1) % BANNERS.length), []);
  const prev = useCallback(() =>
    setCurrent((c) => (c - 1 + BANNERS.length) % BANNERS.length), []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(next, INTERVAL);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, next]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
  }

  return (
    <section
      className="relative w-full overflow-hidden select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label="Featured banners"
    >
      {/* Slides — fixed height so every banner shows fully without cropping.
          `object-contain` keeps the full image visible; the cream background fills
          any space around narrower images so there's no jarring letterbox. */}
      <div className="relative w-full bg-[#FFF8F2]" style={{ height: "clamp(140px, 22vw, 420px)" }}>
        {BANNERS.map((b, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={b.src}
              alt={b.alt}
              fill
              priority={i === 0}
              className="object-contain object-center"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
            />
            {/* CTA overlay */}
            <div className="absolute bottom-4 right-4 z-20 hidden sm:block">
              <Link
                href={b.href}
                className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-terracotta-dark"
              >
                {b.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Prev / Next */}
      <button
        onClick={prev}
        aria-label="Previous banner"
        className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow backdrop-blur-sm transition hover:bg-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={next}
        aria-label="Next banner"
        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow backdrop-blur-sm transition hover:bg-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to banner ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-5 bg-terracotta" : "w-1.5 bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
