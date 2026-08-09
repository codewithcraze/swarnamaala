import Link from "next/link";
import Image from "next/image";
import { PRICING_TIERS, CURRENCY_SYMBOL, EXTRA_MAGNET_PRICE } from "@/lib/pricing";
import { REVIEWS, AVERAGE_RATING } from "@/lib/reviews";
import Reviews from "@/components/Reviews";

import {HighQualityPrint, StrongMagnetIcon, Packageing, Fire, BestPrice, First, Second} from '@/components/svg';

export default function HomePage() {
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Custom Photo Magnet",
    description:
      "Personalised custom photo magnets printed on premium material. Upload your photos and choose a pack of 1, 3, 6 or 10 (or more).",
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
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-10 sm:px-6 md:grid-cols-2 py-10">
          <div style={{ height: "stretch" }} >
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#340d00]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#340d00]" />
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
              custom magnets. Packs starting at just {CURRENCY_SYMBOL}99, delivered across India.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/products/custom-magnets"
                className="rounded-full bg-[#340d00] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-terracotta/25 transition-colors hover:bg-terracotta-dark"
              >
                Create your magnets
              </Link>
              <Link
                href="/#how-it-works"
                className="rounded-full border border-line bg-white px-8 py-3.5 text-base font-semibold text-charcoal transition-colors hover:bg-cream"
              >
                How it works
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted">
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

          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gold/10 blur-3xl" />
            <div className="grid grid-cols-2 gap-4">
              <MagnetCard src="/family.avif" label="Family" rotate="-rotate-3" />
              <MagnetCard src="/love.avif" label="Couple" rotate="rotate-3 mt-8" />
              <MagnetCard src="/birthday.avif" label="Birthday" rotate="rotate-2" />
              <MagnetCard src="/travel.avif" label="Travel" rotate="-rotate-2 mt-6" />
            </div>
          </div>
        </div>
      </section>

      {/* Same-day delivery strip */}
      <section className="bg-[#340d00]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 py-8 text-center text-lg font-medium text-white sm:flex-row sm:gap-6 sm:px-6">
          <span className="flex items-center gap-2">
            Same-day delivery in Noida, Delhi &amp; Ghaziabad
          </span>
          <span>Or within 24-48 hours max, right to your doorstep</span>
        </div>
      </section>
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
   

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-charcoal sm:text-4xl">Three simple steps</h2>
          <p className="mt-3 text-muted">From your camera roll to your doorstep in no time.</p>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Upload your photos",
              desc: "Sign in, choose a pack, and upload one photo for each magnet — or reuse the same photo for all of them.",
            },
            {
              step: "02",
              title: "We print it beautifully",
              desc: "Your photos are printed on premium magnet material with a crisp, vibrant finish.",
            },
            {
              step: "03",
              title: "Delivered to your door",
              desc: "We carefully pack and ship your magnets anywhere in India within days.",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="rounded-2xl border border-line bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-4xl font-extrabold text-gold">{s.step}</span>
              <h3 className="mt-4 text-lg font-semibold text-charcoal">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 py-20 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-terracotta/30 bg-terracotta/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-terracotta">
              Transparent Pricing
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-charcoal sm:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="mt-3 text-muted">The more you order, the more you save per magnet.</p>
          </div>

          {/* Cards */}
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING_TIERS.map((tier) => {
              const isFeatured = tier.badge === "Best Value";
              const isPopular = tier.badge === "Popular";
              return (
                <div
                  key={tier.quantity}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                    isFeatured
                      ? "border-terracotta bg-gradient-to-b from-terracotta to-terracotta-dark text-white shadow-lg shadow-terracotta/30"
                      : isPopular
                        ? "border-gold bg-white shadow-md"
                        : "border-line bg-white shadow-sm"
                  }`}
                >
                  {/* Badge */}
                  {tier.badge && (
                    <div className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold uppercase tracking-widest ${
                      isFeatured ? "bg-terracotta-dark/40 text-white" : "bg-gold text-white"
                    }`}>
                      {isFeatured ? <BestPrice /> : <Fire />}{tier.badge}
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6 text-center">
                    {/* Magnet count */}
                    <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-extrabold ${
                      isFeatured ? "bg-white/20 text-white" : "bg-terracotta/10 text-terracotta"
                    }`}>
                      {tier.quantity}
                    </div>

                    <p className={`text-base font-semibold ${isFeatured ? "text-white" : "text-charcoal"}`}>
                      {tier.label}
                    </p>

                    {/* Price */}
                    <div className="my-5">
                      <div className={`text-5xl font-extrabold leading-none ${isFeatured ? "text-white" : "text-terracotta"}`}>
                        {CURRENCY_SYMBOL}{tier.price}
                      </div>
                      <p className={`mt-2 text-sm ${isFeatured ? "text-white/80" : "text-muted"}`}>
                        {CURRENCY_SYMBOL}{tier.perPiece} per magnet
                      </p>
                      <p className={`text-xs ${isFeatured ? "text-white/60" : "text-muted"}`}>
                        + 18% GST
                      </p>
                    </div>

                    {/* Savings pill — only theme colors */}
                    {tier.quantity > 1 && (
                      <div className={`mx-auto mb-5 rounded-full px-3 py-1 text-xs font-semibold ${
                        isFeatured
                          ? "bg-white/20 text-white"
                          : "bg-gold/15 text-charcoal"
                      }`}>
                        Save {CURRENCY_SYMBOL}{(99 - tier.perPiece) * tier.quantity} vs single
                      </div>
                    )}

                    <Link
                      href={`/products/custom-magnets?qty=${tier.quantity}`}
                      className={`mt-auto block rounded-full py-3 text-sm font-bold transition-all hover:scale-[1.03] ${
                        isFeatured
                          ? "bg-white text-terracotta hover:bg-cream"
                          : "bg-terracotta text-white hover:bg-terracotta-dark"
                      }`}
                    >
                      Order Now →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom quantity note */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white px-6 py-4 shadow-sm">
              <span className="text-2xl">📦</span>
              <div>
                <p className="text-sm font-semibold text-charcoal">Need more than 10 magnets?</p>
                <p className="text-sm text-muted">
                  Each extra magnet is just <span className="font-bold text-terracotta">{CURRENCY_SYMBOL}{EXTRA_MAGNET_PRICE}</span>
                  &nbsp;· All prices excl. 18% GST
                </p>
              </div>
              <Link
                href="/products/custom-magnets?qty=15"
                className="shrink-0 rounded-full border border-terracotta px-4 py-2 text-xs font-semibold text-terracotta transition-colors hover:bg-terracotta hover:text-white"
              >
                Customise
              </Link>
            </div>
          </div>
        </div>
      </section>

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
                order: 399, reward: 29,
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
                {/* Decorative circles using theme white */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/50" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/40" />

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

          {/* CTA block — uses charcoal→terracotta gradient (all theme) */}
          <div className="relative mt-14 overflow-hidden rounded-3xl bg-gradient-to-r from-charcoal to-terracotta px-8 py-10 text-center shadow-xl sm:px-16">
            <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-gold/10 blur-2xl" />
            <p className="relative text-sm font-semibold uppercase tracking-widest text-white/60">Ready to earn?</p>
            <h3 className="relative mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              Get your referral link in seconds
            </h3>
            <p className="relative mx-auto mt-2 max-w-md text-sm text-white/75">
              No minimum. No expiry. Every referred order earns you cash — forever.
            </p>
            <div className="relative mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="rounded-full bg-white px-8 py-3 text-sm font-bold text-terracotta shadow-lg transition-transform hover:scale-[1.04]"
              >
                Get my referral link →
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-white/30 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
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
            <div key={f.title} className="rounded-2xl border border-line bg-white p-8 shadow-sm">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-charcoal">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <div id="reviews" className="scroll-mt-20">
        <Reviews />
      </div>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-terracotta to-terracotta-dark px-8 py-14 text-center shadow-xl sm:px-16">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to make your memories magnetic?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">
            Upload your photos today and get premium custom magnets delivered to your door.
          </p>
          <Link
            href="/products/custom-magnets"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-base font-semibold text-terracotta shadow-lg transition-transform hover:scale-[1.03]"
          >
            Start creating
          </Link>
        </div>
      </section>
    </>
  );
}

function MagnetCard({
  src,
  label,
  rotate,
}: {
  src: string;
  label: string;
  rotate: string;
}) {
  return (
    <div className={`animate-floaty rounded-2xl border border-line bg-white p-2 shadow-xl ${rotate}`}>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-cream">
        <Image
          src={src}
          alt={`${label} custom magnet`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 45vw, 260px"
          priority
        />
      </div>
      <p className="mt-2 text-center text-sm font-semibold text-charcoal">{label}</p>
    </div>
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
