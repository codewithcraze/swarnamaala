"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef } from "react";
import { CURRENCY_SYMBOL } from "@/lib/pricing";
import { useLazyMount } from "@/lib/useLazyMount";

// The WebGL scene is heavy and browser-only, so load it on the client only.
const MagnetScene = dynamic(() => import("./MagnetScene"), {
  ssr: false,
  loading: () => null,
});

export default function MagnetShowcase() {
  const stageRef = useRef<HTMLDivElement>(null);
  const { mounted, visible } = useLazyMount(stageRef);

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
        {/* 3D magnet — move your cursor (or finger) over it to tilt */}
        <div ref={stageRef} className="relative h-[300px] sm:h-[400px] lg:h-[460px]">
          {mounted && <MagnetScene image="/family.avif" active={visible} />}
        </div>

        {/* Copy */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-terracotta">
            See it in 3D
          </span>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight text-charcoal sm:text-4xl">
            Glossy photo front.
            <span className="block text-terracotta">Strong magnetic back.</span>
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted">
            Give it a moment and watch it turn. Your photo is printed edge-to-edge on a
            premium glossy surface, backed by a full magnetic sheet that grips the fridge
            firmly — no weak corners, no slipping.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-charcoal">
            {[
              "Rich, true-to-life colour printing",
              "Full-surface magnet, not just a dot",
              "Rounded, scratch-resistant edges",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-terracotta">
                  <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/products/custom-magnets"
            className="mt-8 inline-block rounded-full bg-terracotta px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-terracotta/25 transition-colors hover:bg-terracotta-dark"
          >
            Make yours from {CURRENCY_SYMBOL}299
          </Link>
        </div>
      </div>
    </section>
  );
}
