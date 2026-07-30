import Link from "next/link";
import Image from "next/image";
import { PRICING_TIERS, CURRENCY_SYMBOL, EXTRA_MAGNET_PRICE } from "@/lib/pricing";
import { REVIEWS, AVERAGE_RATING } from "@/lib/reviews";
import Reviews from "@/components/Reviews";

const REFERRAL_TIERS = [
  { order: 399, reward: 29, tone: "bg-gold/15 text-terracotta-dark" },
  { order: 499, reward: 39, tone: "bg-terracotta/15 text-terracotta-dark" },
  { order: 699, reward: 49, tone: "bg-[#e7f0e0] text-[#4a6b39]" },
];

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
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-terracotta">
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
              custom magnets. Packs starting at just {CURRENCY_SYMBOL}99, delivered across India.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/products/custom-magnets"
                className="rounded-full bg-terracotta px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-terracotta/25 transition-colors hover:bg-terracotta-dark"
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
      <section className="bg-terracotta">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 py-3 text-center text-sm font-medium text-white sm:flex-row sm:gap-6 sm:px-6">
          <span className="flex items-center gap-2">
            🛵 Same-day delivery in Noida, Delhi &amp; Ghaziabad
          </span>
          <span className="hidden h-4 w-px bg-white/30 sm:block" />
          <span>Or within 24–48 hours max, right to your doorstep</span>
        </div>
      </section>

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
      <section id="pricing" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-charcoal sm:text-4xl">Simple, honest pricing</h2>
            <p className="mt-3 text-muted">The more you order, the more you save per magnet.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.quantity}
                className={`relative rounded-2xl border bg-white p-6 text-center shadow-sm transition-transform hover:-translate-y-1 ${
                  tier.badge === "Best Value" ? "border-terracotta ring-2 ring-terracotta/30" : "border-line"
                }`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-terracotta px-3 py-1 text-xs font-semibold text-white">
                    {tier.badge}
                  </span>
                )}
                <p className="text-lg font-semibold text-charcoal">{tier.label}</p>
                <p className="mt-4 text-4xl font-extrabold text-terracotta">
                  {CURRENCY_SYMBOL}
                  {tier.price}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {CURRENCY_SYMBOL}
                  {tier.perPiece} per magnet
                </p>
                <p className="mt-0.5 text-xs text-muted">+ 18% GST</p>
                <Link
                  href={`/products/custom-magnets?qty=${tier.quantity}`}
                  className="mt-6 block rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-dark"
                >
                  Choose pack
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            Need more than 10? Add as many as you like — each extra magnet is just{" "}
            <span className="font-semibold text-charcoal">
              {CURRENCY_SYMBOL}
              {EXTRA_MAGNET_PRICE}
            </span>
            . All prices exclusive of 18% GST, added at checkout.
          </p>
        </div>
      </section>

      {/* Refer & Earn */}
      <section className="bg-[#fdf1e6] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-terracotta">
              Refer, share &amp; earn rewards
            </span>
            <h2 className="mt-2 text-3xl font-bold text-charcoal sm:text-4xl">
              Invite friends, earn on every order
            </h2>
            <p className="mt-3 text-muted">
              Share your referral link. When a friend places an order, you earn a reward
              credited to your wallet once their order is delivered.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {REFERRAL_TIERS.map((t) => (
              <div key={t.order} className="rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
                <span className={`inline-block rounded-full px-4 py-1 text-xs font-semibold ${t.tone}`}>
                  Order worth {CURRENCY_SYMBOL}
                  {t.order}
                </span>
                <p className="mt-4 text-sm font-medium text-muted">Earn</p>
                <p className="text-4xl font-extrabold text-terracotta">
                  {CURRENCY_SYMBOL}
                  {t.reward}
                </p>
                <p className="mt-1 text-xs text-muted">per successful order</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/dashboard"
              className="inline-block rounded-full bg-charcoal px-8 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get your referral link
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { icon: "🎨", title: "High quality print", desc: "Vibrant, long-lasting, high-resolution printing that keeps your photos crisp." },
            { icon: "🧲", title: "Strong magnet", desc: "Durable backing that holds strongly and lasts for years." },
            { icon: "📦", title: "Safe packaging", desc: "Each order is packed with care so it arrives in perfect shape." },
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
