"use client";

import { useEffect, useRef, useState } from "react";

// "Three simple steps": a dashed track that slowly fills with gold when the
// section scrolls into view; each step lights up as the line reaches it.
// Horizontal on desktop, vertical on mobile. Respects reduced-motion.

const FILL_MS = 3600; // slow, deliberate completion of the track

const STEPS = [
  {
    title: "Upload your photos",
    desc: "Sign in, choose a pack, and add one photo for each magnet. Want the same photo on all of them? That works too.",
    art: <UploadArt />,
  },
  {
    title: "We print it on magnet",
    desc: "Each photo is printed on premium magnet material with a crisp, vibrant finish.",
    art: <PrintArt />,
  },
  {
    title: "Delivered to your door",
    desc: "We pack your magnets with care and ship them anywhere in India.",
    art: <DeliverArt />,
    chip: "Arrives within days",
  },
];

export default function StepsTimeline() {
  const ref = useRef<HTMLOListElement>(null);
  const [go, setGo] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setGo(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGo(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20 sm:px-8 sm:py-24">
      <header className="mb-10 max-w-xl sm:mb-16">
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-charcoal sm:text-[2.9rem]">
          From camera roll to fridge door in three steps
        </h2>
        <p className="mt-3.5 text-[17px] text-muted">Pick a pack, add your photos, and we handle the rest.</p>
      </header>

      <ol
        ref={ref}
        className={`steps-track relative grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10 ${go ? "go" : ""}`}
        style={{ "--fill-ms": `${FILL_MS}ms` } as React.CSSProperties}
      >
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative pl-[68px] md:pl-0">
            <div
              className="step-node absolute left-0 top-0 z-[1] grid h-11 w-11 place-items-center rounded-full text-[17px] font-bold md:relative"
              // Each node lights up as the gold line reaches it.
              style={{ transitionDelay: `${(FILL_MS * i) / (STEPS.length - 1) * 0.92}ms` }}
            >
              {i + 1}
            </div>
            <div
              className="step-art mb-6 grid aspect-[4/3] max-w-[320px] place-items-center overflow-hidden rounded-[22px] border border-line bg-surface md:mt-7"
              style={{ transitionDelay: `${(FILL_MS * i) / (STEPS.length - 1) * 0.92}ms` }}
              aria-hidden="true"
            >
              {s.art}
            </div>
            <h3 className="mb-2 text-[21px] font-semibold text-charcoal">{s.title}</h3>
            <p className="max-w-[300px] text-[15.5px] leading-relaxed text-muted">{s.desc}</p>
            {s.chip && (
              <span className="mt-3.5 inline-block rounded-full border border-line px-3 py-1 text-[13px] font-medium text-charcoal">
                {s.chip}
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function UploadArt() {
  return (
    <svg viewBox="0 0 200 150" className="h-auto w-[78%]">
      <rect x="68" y="8" width="64" height="134" rx="12" fill="none" stroke="#7d7062" strokeWidth="3" />
      <rect x="76" y="24" width="48" height="48" rx="6" fill="#c9a14a" />
      <circle cx="90" cy="38" r="5" fill="#f4ece0" />
      <path d="M76 72l14-16 10 10 8-8 16 14z" fill="#8a6a26" />
      <rect x="76" y="80" width="22" height="22" rx="4" fill="#3a3129" />
      <rect x="102" y="80" width="22" height="22" rx="4" fill="#3a3129" />
      <rect x="76" y="106" width="22" height="22" rx="4" fill="#3a3129" />
      <rect x="102" y="106" width="22" height="22" rx="4" fill="#3a3129" />
      <path
        className="step-pulse"
        d="M150 70v-30m-10 10l10-10 10 10"
        stroke="#dfbd6c"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PrintArt() {
  return (
    <svg viewBox="0 0 200 150" className="h-auto w-[78%]">
      <g transform="rotate(-6 100 75)">
        <rect x="46" y="18" width="108" height="108" rx="3" fill="#2a231d" stroke="#4a3f35" strokeWidth="2" />
        <rect x="56" y="28" width="88" height="88" rx="2" fill="#c9a14a" />
        <circle cx="82" cy="52" r="9" fill="#f4ece0" />
        <path d="M56 116l30-34 20 20 14-14 24 28z" fill="#8a6a26" />
        <path d="M56 28h88v30L56 100z" fill="#fff" opacity=".14" />
      </g>
      <g stroke="#7d7062" strokeWidth="2" strokeLinecap="round" opacity=".8">
        <path d="M30 14v12M24 20h12M170 14v12M164 20h12M30 132v-12M24 126h12M170 132v-12M164 126h12" />
      </g>
    </svg>
  );
}

function DeliverArt() {
  return (
    <svg viewBox="0 0 200 150" className="h-auto w-[78%]">
      <path d="M40 56l60-28 60 28v62l-60 28-60-28z" fill="#9c7a45" />
      <path d="M40 56l60 28 60-28" fill="none" stroke="#6f5530" strokeWidth="3" />
      <path d="M100 84v62" stroke="#6f5530" strokeWidth="3" />
      <path d="M76 42l60 28v14l-12-6V76L64 48z" fill="#d9c49a" />
      <circle cx="160" cy="34" r="18" fill="#c9a14a" />
      <path d="M151 34l6 6 11-12" stroke="#1a130b" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
