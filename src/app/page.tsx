import Link from "next/link";
import Image from "next/image";
import { PRICING_TIERS, CURRENCY_SYMBOL, EXTRA_MAGNET_PRICE } from "@/lib/pricing";
import { REVIEWS, AVERAGE_RATING } from "@/lib/reviews";
import TestimonialWall from "@/components/TestimonialWall";
import MagnetShowcase from "@/components/MagnetShowcase";
import MagnetHero from "@/components/MagnetHero";
import StepsTimeline from "@/components/StepsTimeline";
import PricingSection from "@/components/PricingSection";

import {HighQualityPrint, StrongMagnetIcon, Packageing, Fire, BestPrice, First, Second} from '@/components/svg';

export default function HomePage() {
  // Per-magnet rate of the smallest pack — used as the baseline for "you save" copy.
  const BASE_PER_PIECE = PRICING_TIERS[0].perPiece;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Custom Photo Magnet",
    description:
      "Personalised custom photo magnets printed on premium material. Upload your photos and choose a pack of 6, 12 or 18 (or any amount up to 50).",
    brand: { "@type": "Brand", name: "swarnamaala.in" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: AVERAGE_RATING,
      reviewCount: REVIEWS.length,
    },
    offers: PRICING_TIERS.map((t) => ({
      "@type": "Offer",
      priceCurrency: "INR",
      price: t.price,
      description: t.label,
      availability: "https://schema.org/InStock",
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />


      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 sm:px-6 md:gap-12 md:grid-cols-2 md:py-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-terracotta/40 bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-terracotta">
              <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
              Premium custom photo magnets
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-charcoal sm:text-5xl lg:text-6xl">
              Your memories,
              <span className="block text-terracotta">our magnets.</span>
            </h1>
            <p className="mt-4 text-lg font-medium text-charcoal/80">
              Made with love, made to stick.
            </p>
            <p className="mt-4 max-w-lg leading-relaxed text-muted">
              Upload your favourite photos and we&apos;ll turn them into beautiful, durable
              custom magnets. Packs starting at just {CURRENCY_SYMBOL}299, delivered across India.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/products/custom-magnets"
                className="rounded-full bg-terracotta px-8 py-3.5 text-base font-semibold text-onaccent shadow-lg shadow-terracotta/20 transition-colors hover:bg-terracotta-dark"
              >
                Create your magnets
              </Link>
              <Link
                href="/#how-it-works"
                className="rounded-full border border-line bg-surface px-8 py-3.5 text-base font-semibold text-charcoal transition-colors hover:bg-cream"
              >
                How it works
              </Link>
            </div>
            {/* Social proof row */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {["/feedback/alka.jpeg", "/feedback/suman.jpeg", "/feedback/customer3.jpeg", "/feedback/customer4.jpeg"].map((src) => (
                  <span key={src} className="relative inline-block h-9 w-9 overflow-hidden rounded-full border-2 border-cream shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="Happy customer" className="h-full w-full object-cover" loading="lazy" />
                  </span>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-muted">
                  <span className="font-semibold text-charcoal">{AVERAGE_RATING}/5</span> from 2,000+ happy customers
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted">
              <span className="flex items-center gap-2">
                <CheckIcon /> Free design preview
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon /> Premium finish
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon /> Pan-India delivery
              </span>
            </div>
          </div>

          <div className="relative min-w-0">
            <MagnetHero />
          </div>
        </div>
      </section>

      {/* Same-day delivery strip */}
   
      {/* Full-width banner carousel — shown before the hero */}




      {/* Trust bar */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          {[
            { stat: "10k+", label: "Magnets delivered" },
            { stat: `${AVERAGE_RATING}\u2605`, label: "Average rating" },
            { stat: "48 hrs", label: "Dispatch time" },
            { stat: "100%", label: "Happiness guarantee" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-2xl font-bold text-terracotta sm:text-3xl">{item.stat}</p>
              <p className="mt-1 text-sm text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
   

      {/* How it works — animated timeline */}
      <StepsTimeline />

      {/* 3D magnet showcase */}
      <MagnetShowcase />

      {/* Occasions / use-cases */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-charcoal">
            A little magnet, a big feeling
          </span>
          <h2 className="mt-4 text-3xl font-bold text-charcoal sm:text-4xl">Made for the moments you keep</h2>
          <p className="mt-3 text-muted">
            The wedding you cried at. The trip you still talk about. The dog who runs the house.
            Put them where you&apos;ll see them every single day.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { src: "/family.avif", title: "Family frames", desc: "Three generations on one fridge door." },
            { src: "/love.avif", title: "Couples & weddings", desc: "Anniversaries that stay in sight." },
            { src: "/birthday.avif", title: "Birthdays & gifts", desc: "A present that actually gets used." },
            { src: "/travel.avif", title: "Travel memories", desc: "Every trip, back home with you." },
          ].map((o) => (
            <div key={o.title} className="group overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="relative aspect-[4/5] overflow-hidden bg-cream">
                <Image
                  src={o.src}
                  alt={o.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/70 to-transparent p-4 pt-10">
                  <p className="text-base font-bold text-white">{o.title}</p>
                  <p className="text-xs text-white/85">{o.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* Refer & Earn */}
      <section className="relative overflow-hidden py-8">
        {/* Background blobs — only theme colors */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-terracotta/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mt-5 text-3xl font-extrabold text-charcoal sm:text-4xl lg:text-5xl">
              Share the love,{" "}
              <span className="bg-gradient-to-r from-terracotta to-gold bg-clip-text text-transparent">
                earn real cash
              </span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Invite a friend to order custom magnets. They get beautiful memories — you get{" "}
              <strong className="text-charcoal">₹29 to ₹49 credited</strong> to your wallet the moment their order is delivered.
            </p>
          </div>

          {/* Reward tier cards — all theme tokens */}
          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {[
              {
                order: 299, reward: 29,
                icon: "🥉", label: "Starter",
                bg: "from-cream to-line/40",
                border: "border-line",
                badge: "bg-line text-charcoal",
              },
              {
                order: 499, reward: 39,
                icon: <Second />, label: "Silver",
                bg: "from-terracotta/8 to-cream",
                border: "border-terracotta/40",
                badge: "bg-terracotta/10 text-terracotta-dark",
              },
              {
                order: 699, reward: 49,
                icon: <First />, label: "Gold",
                bg: "from-gold/15 to-cream",
                border: "border-gold/60",
                badge: "bg-gold/20 text-charcoal",
              },
            ].map((t) => (
              <div
                key={t.order}
                className={`group relative overflow-hidden rounded-3xl border-2 bg-gradient-to-br p-7 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${t.bg} ${t.border}`}
              >
                <div className="relative">
                  <div className="flex justify-center text-5xl">{t.icon}</div>
                  <p className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${t.badge}`}>
                    {t.label} reward
                  </p>
                  <p className="mt-3 text-sm text-muted">
                    When friend orders{" "}
                    <span className="font-bold text-charcoal">{CURRENCY_SYMBOL}{t.order}+</span>
                  </p>
                  <p className="mt-4 text-sm font-medium text-muted">You earn</p>
                  <p className="text-5xl font-extrabold text-terracotta">
                    {CURRENCY_SYMBOL}{t.reward}
                  </p>
                  <p className="mt-1 text-xs text-muted">credited after delivery</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA block */}
          <div className="relative mt-14 overflow-hidden rounded-3xl border border-terracotta/40 bg-surface px-8 py-10 text-center sm:px-16">
            <p className="relative text-sm font-semibold uppercase tracking-widest text-terracotta">Ready to earn?</p>
            <h3 className="relative mt-2 text-2xl font-extrabold text-charcoal sm:text-3xl">
              Get your referral link in seconds
            </h3>
            <p className="relative mx-auto mt-2 max-w-md text-sm text-muted">
              No minimum. No expiry. Every referred order earns you cash — forever.
            </p>
            <div className="relative mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="rounded-full bg-terracotta px-8 py-3 text-sm font-bold text-onaccent transition-colors hover:bg-terracotta-dark"
              >
                Get my referral link →
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-line px-8 py-3 text-sm font-semibold text-charcoal transition-colors hover:border-terracotta"
              >
                Create account first
              </Link>
            </div>
            {/* <div className="relative mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50">
              <span>✅ No minimum orders</span>
              <span>✅ Instant wallet credit</span>
              <span>✅ Share via WhatsApp</span>
            </div> */}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: <HighQualityPrint />
              , title: "High quality print", desc: "Vibrant, long-lasting, high-resolution printing that keeps your photos crisp."
            },
            {
              icon: <StrongMagnetIcon />
              , title: "Strong magnet", desc: "Durable backing that holds strongly and lasts for years."
            },
            {
              icon: <Packageing />
              , title: "Safe packaging", desc: "Each order is packed with care so it arrives in perfect shape."
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-charcoal">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews — full-height wall of love */}
      <div id="reviews" className="scroll-mt-20">
        <TestimonialWall />
      </div>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-terracotta to-terracotta-dark px-8 py-14 text-center shadow-xl sm:px-16">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-surface/10 blur-2xl" />
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to make your memories magnetic?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">
            Upload your photos today and get premium custom magnets delivered to your door.
          </p>
          <Link
            href="/products/custom-magnets"
            className="mt-8 inline-block rounded-full bg-surface px-8 py-3.5 text-base font-semibold text-terracotta shadow-lg transition-transform hover:scale-[1.03]"
          >
            Start creating
          </Link>
        </div>
      </section>
    </>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-terracotta">
      <path
        d="m5 13 4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
