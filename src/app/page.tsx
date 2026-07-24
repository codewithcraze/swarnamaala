import Link from "next/link";
import Image from "next/image";
import { PRICING_TIERS, CURRENCY_SYMBOL } from "@/lib/pricing";
import { REVIEWS, AVERAGE_RATING } from "@/lib/reviews";
import Reviews from "@/components/Reviews";

export default function HomePage() {
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Custom Photo Magnet",
    description:
      "Personalised custom photo magnets printed on premium material. Upload your photos and choose a pack of 1, 3, 6 or 10.",
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
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-4 sm:px-6 md:grid-cols-2">
          <div>
            
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Your memories,
              <span className="block bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                stuck in the moment.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-400">
              Upload your favourite photos and we&apos;ll turn them into beautiful, durable
              custom magnets. Packs starting at just {CURRENCY_SYMBOL}99, delivered across India.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/products/custom-magnets"
                className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-[1.03]"
              >
                Create your magnets
              </Link>
              <Link
                href="/#how-it-works"
                className="rounded-full border border-slate-700 bg-slate-900/40 px-8 py-3.5 text-base font-semibold text-slate-200 transition-colors hover:bg-slate-800"
              >
                How it works
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-400">
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
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="grid grid-cols-2 gap-4">
              <MagnetCard className="from-rose-500/80 to-pink-600/80" src="/family.avif" label="Family" rotate="-rotate-3" />
              <MagnetCard className="from-sky-500/80 to-blue-600/80" src="/love.avif" label="Couple" rotate="rotate-3 mt-8" />
              <MagnetCard className="from-amber-500/80 to-orange-600/80" src="/birthday.avif" label="Birthday" rotate="rotate-2" />
              <MagnetCard className="from-emerald-500/80 to-teal-600/80" src="/travel.avif" label="Travel" rotate="-rotate-2 mt-6" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-slate-800 bg-slate-900/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          {[
            { stat: "10k+", label: "Magnets delivered" },
            { stat: `${AVERAGE_RATING}\u2605`, label: "Average rating" },
            { stat: "48 hrs", label: "Dispatch time" },
            { stat: "100%", label: "Happiness guarantee" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-2xl font-bold text-blue-400 sm:text-3xl">{item.stat}</p>
              <p className="mt-1 text-sm text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Three simple steps</h2>
          <p className="mt-3 text-slate-400">
            From your camera roll to your doorstep in no time.
          </p>
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
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-sm transition-colors hover:border-blue-500/40"
            >
              <span className="text-4xl font-extrabold text-blue-500/30">{s.step}</span>
              <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Simple, honest pricing</h2>
            <p className="mt-3 text-slate-400">The more you order, the more you save per magnet.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.quantity}
                className={`relative rounded-2xl border bg-slate-900/60 p-6 text-center backdrop-blur-sm transition-transform hover:-translate-y-1 ${
                  tier.badge === "Best Value"
                    ? "border-blue-500 ring-2 ring-blue-500/40"
                    : "border-slate-800"
                }`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                    {tier.badge}
                  </span>
                )}
                <p className="text-lg font-semibold text-white">{tier.label}</p>
                <p className="mt-4 text-4xl font-extrabold text-blue-400">
                  {CURRENCY_SYMBOL}
                  {tier.price}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {CURRENCY_SYMBOL}
                  {tier.perPiece} per magnet
                </p>
                <Link
                  href={`/products/custom-magnets?qty=${tier.quantity}`}
                  className="mt-6 block rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                >
                  Choose pack
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { icon: "\uD83C\uDFA8", title: "Vivid, true-to-life colour", desc: "High-resolution printing that keeps your photos crisp and colourful." },
            { icon: "\uD83E\uDDF2", title: "Strong, lasting magnets", desc: "Durable backing that grips firmly and lasts for years." },
            { icon: "\uD83D\uDCE6", title: "Safe, protective packaging", desc: "Each order is packed with care so it arrives in perfect shape." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-sm">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 px-8 py-14 text-center shadow-2xl shadow-blue-900/40 sm:px-16">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to make your memories magnetic?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100/90">
            Upload your photos today and get premium custom magnets delivered to your door.
          </p>
          <Link
            href="/products/custom-magnets"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg transition-transform hover:scale-[1.03]"
          >
            Start creating
          </Link>
        </div>
      </section>
    </>
  );
}

function MagnetCard({
  className,
  src,
  label,
  rotate,
}: {
  className: string;
  src: string;
  label: string;
  rotate: string;
}) {
  return (
    <div
      className={`animate-floaty rounded-2xl bg-gradient-to-br ${className} p-1.5 shadow-2xl ${rotate}`}
    >
      <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-950/40">
          <Image
            src={src}
            alt={`${label} custom magnet`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 45vw, 260px"
            priority
          />
        </div>
        <p className="mt-2 text-center text-sm font-semibold text-white">{label}</p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-blue-400">
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
