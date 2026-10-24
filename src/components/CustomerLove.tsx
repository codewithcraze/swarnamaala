"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// "Loved on fridges across India": a swipeable row of real customer photos.
// Scroll-snap track + prev/next buttons + a gold progress bar showing position.

type Review = { name: string; city: string; text: string; photo: string; alt: string };

// Real reviews with the photos customers sent after delivery.
const REVIEWS: Review[] = [
  { name: "Kaur", city: "Delhi, Karol Bagh", text: "Product Qualtiy is top notch and print is very clear", photo: '/feedback/customer1.jpeg', alt: "fridge magnet"},
  { name: "Sheetal", city: "Uttar Pradesh", text: "Very Nice Product", photo: '/feedback/customer2.jpeg', alt: "fridge magnet"},
  { name: "Alka Chaudhary", city: "Dwarka, Delhi", text: "Print is good and magnet is too strong.", photo: "/feedback/alka.jpeg", alt: "Baby photo magnets on a fridge" },
  { name: "Shekhar & Suman", city: "Bulandshahr", text: "Nice magnets, amazing product.", photo: "/feedback/suman.jpeg", alt: "Two portrait magnets on a fridge" },
  { name: "Priyanka Thakur", city: "Greater Noida", text: "Very nice, the print is too good.", photo: "/feedback/customer4.jpeg", alt: "Photo magnets received by Priyanka" },
  { name: "Deepak Chaudhary", city: "Noida", text: "Pictures are so good. I asked for different shapes with resin work and the delivered product was great.", photo: "/feedback/customer3.jpeg", alt: "Custom magnets received by Deepak" },
  { name: "Priya S.", city: "Mumbai", text: "The colours are exactly like the original photo. Our fridge looks so much happier now!", photo: "/feedback/customer.png", alt: "Colourful photo magnets on a fridge" },
  { name: "Rohit K.", city: "Bengaluru", text: "Ordered a set for my parents' anniversary. Packaging was solid and delivery was faster than expected.", photo: "/feedback/customer2.png", alt: "Anniversary photo magnets" },
];

function Check() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-[13px] w-[13px]">
      <path d="M3 8.5l3.2 3.2L13 4.8" />
    </svg>
  );
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

export default function CustomerLove() {
  const track = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [bar, setBar] = useState({ width: 25, left: 0 });

  const update = useCallback(() => {
    const t = track.current;
    if (!t) return;
    const max = t.scrollWidth - t.clientWidth;
    const x = t.scrollLeft;
    setAtStart(x <= 2);
    setAtEnd(x >= max - 2);
    const w = (t.clientWidth / t.scrollWidth) * 100;
    setBar({ width: w, left: max > 0 ? (x / max) * (100 - w) : 0 });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  // Scroll by exactly one card (card width + gap).
  function step(dir: 1 | -1) {
    const t = track.current;
    const card = t?.querySelector("figure");
    if (!t || !card) return;
    const gap = parseFloat(getComputedStyle(t).columnGap || "20") || 20;
    t.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: "smooth" });
  }

  return (
    <section aria-labelledby="customer-love-title">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <h2 id="customer-love-title" className="mb-3 max-w-[560px] text-[26px] font-bold leading-tight tracking-tight text-charcoal sm:text-[34px]">
            Loved on fridges across India
          </h2>
          <p className="text-[15px] text-muted sm:text-[17px]">
            Real photos from real customers, shared after their magnets arrived.
          </p>
        </div>
        <div className="flex flex-none gap-2.5">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => step(d)}
              disabled={d === -1 ? atStart : atEnd}
              aria-label={d === -1 ? "Previous reviews" : "Next reviews"}
              className="grid h-12 w-12 cursor-pointer place-items-center rounded-full border-[1.5px] border-line bg-surface text-charcoal transition-colors hover:border-terracotta hover:bg-terracotta hover:text-onaccent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-default disabled:opacity-35 disabled:hover:border-line disabled:hover:bg-surface disabled:hover:text-charcoal"
            >
              <Arrow dir={d === -1 ? "left" : "right"} />
            </button>
          ))}
        </div>
      </div>

      <div
        ref={track}
        onScroll={update}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
        }}
        tabIndex={0}
        aria-label="Customer reviews"
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 pt-2 focus-visible:outline-none motion-reduce:scroll-auto"
      >
        {REVIEWS.map((r) => (
          <figure
            key={r.name}
            className="m-0 flex shrink-0 grow-0 basis-[82%] snap-start flex-col overflow-hidden rounded-[22px] border border-line bg-surface transition-colors hover:border-terracotta sm:basis-[calc((100%-20px)/2)] xl:basis-[calc((100%-40px)/3)]"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.photo} alt={r.alt} loading="lazy" decoding="async" className="block h-full w-full object-cover" />
              <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-[#110d0a]/80 px-3 py-1 text-[12.5px] font-semibold text-terracotta backdrop-blur-md">
                <Check />
                Verified buyer
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-3 px-5 pb-[22px] pt-5">
              <div className="text-[15px] tracking-[2px] text-terracotta" aria-label="5 out of 5 stars">
                ★★★★★
              </div>
              <blockquote className="m-0 flex-1 text-[17px] font-medium leading-snug text-charcoal">
                &ldquo;{r.text}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-3 border-t border-line pt-3.5">
                <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full bg-terracotta font-bold text-onaccent">
                  {r.name.charAt(0)}
                </span>
                <div>
                  <b className="block text-[14.5px] font-semibold text-charcoal">{r.name}</b>
                  <span className="text-[13px] text-muted">{r.city}</span>
                </div>
              </figcaption>
            </div>
          </figure>
        ))}
      </div>

      {/* Position indicator */}
      <div className="mt-5 h-[3px] overflow-hidden rounded-[3px] bg-line" aria-hidden="true">
        <i
          className="block h-full rounded-[3px] bg-terracotta transition-[margin-left,width] duration-200 motion-reduce:transition-none"
          style={{ width: `${bar.width}%`, marginLeft: `${bar.left}%` }}
        />
      </div>
    </section>
  );
}
