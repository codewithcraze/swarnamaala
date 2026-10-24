import Link from "next/link";
import { PRICING_TIERS, CURRENCY_SYMBOL, EXTRA_MAGNET_PRICE, MAX_QUANTITY, BASE_PACK_QTY } from "@/lib/pricing";

// Pricing cards driven by PRICING_TIERS, so the page always matches checkout.
// Each card shows one tile per magnet in the pack for an at-a-glance sense of size.

const TILE_SHADES = ["#c9a14a", "#a8803a", "#dfbd6c", "#8a6a26", "#e8cf8f", "#73561f", "#d4b064", "#b38d42"];
const WORDS = ["", "one", "two", "three", "four", "five"];

// "Save ₹99 vs two 6-packs" — savings compared with buying the smallest pack repeatedly.
function savingsLine(quantity: number, price: number) {
  const base = PRICING_TIERS[0];
  if (quantity <= base.quantity || quantity % base.quantity !== 0) return null;
  const packs = quantity / base.quantity;
  const save = packs * base.price - price;
  if (save <= 0) return null;
  return `Save ${CURRENCY_SYMBOL}${save} vs ${WORDS[packs] ?? packs} ${base.quantity}-packs`;
}

function Tiles({ n, offset }: { n: number; offset: number }) {
  return (
    <div className="mb-7 grid grid-cols-6 gap-1.5" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <i
          key={i}
          className="block aspect-square rounded-[4px]"
          style={{ background: TILE_SHADES[(i * 3 + offset) % TILE_SHADES.length] }}
        />
      ))}
    </div>
  );
}

export default function PricingSection() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20 sm:px-8 sm:py-24">
      <header className="mb-14 max-w-xl">
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-charcoal sm:text-[2.9rem]">
          Simple, honest pricing
        </h2>
        <p className="mt-3.5 text-[17px] text-muted">
          The more you order, the less each magnet costs. Prices are all-inclusive, with nothing added at
          checkout.
        </p>
      </header>

      <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-3 md:gap-6">
        {PRICING_TIERS.map((tier) => {
          const popular = tier.badge === "Popular";
          const best = tier.badge === "Best Value";
          const save = savingsLine(tier.quantity, tier.price);

          const card = best
            ? "bg-charcoal text-onaccent border border-charcoal"
            : popular
              ? "bg-surface border-2 border-terracotta"
              : "bg-surface border border-line";
          const sub = best ? "text-[#6b5f50]" : "text-muted";
          const btn = best
            ? "bg-onaccent text-charcoal hover:bg-terracotta hover:text-onaccent"
            : popular
              ? "bg-terracotta text-onaccent hover:bg-terracotta-dark"
              : "border-2 border-charcoal text-charcoal hover:bg-charcoal hover:text-onaccent";

          return (
            <article key={tier.quantity} className={`relative flex flex-col rounded-3xl px-7 pb-7 pt-8 ${card}`}>
              {tier.badge && (
                <span
                  className={`absolute -top-3.5 left-7 rounded-full px-3.5 py-1 text-[13px] font-semibold ${
                    best ? "bg-terracotta text-onaccent" : "bg-terracotta text-onaccent"
                  }`}
                >
                  {popular ? "Most popular" : tier.badge}
                </span>
              )}

              <Tiles n={tier.quantity} offset={tier.quantity} />

              <h3 className="mb-1 text-[17px] font-semibold">{tier.label}</h3>
              <p className="text-[46px] font-bold leading-tight tracking-tight sm:text-[54px]">
                {CURRENCY_SYMBOL}
                {tier.price}
              </p>
              <p className={`mt-1.5 text-[15px] ${sub}`}>
                {CURRENCY_SYMBOL}
                {tier.perPiece} per magnet
              </p>
              <p className={`mt-0.5 text-[13px] ${sub}`}>All-inclusive, no hidden GST</p>

              {save ? (
                <p
                  className={`mt-[18px] self-start rounded-full px-3 py-1 text-[13px] font-semibold ${
                    best ? "bg-terracotta text-onaccent" : "bg-terracotta/15 text-gold"
                  }`}
                >
                  {save}
                </p>
              ) : (
                <p className={`mt-[18px] flex min-h-7 items-center text-[13px] ${sub}`}>A good way to try us out</p>
              )}

              <div className="min-h-5 flex-1 md:min-h-7" />

              <Link
                href={`/products/custom-magnets?qty=${tier.quantity}`}
                className={`block rounded-[14px] px-5 py-3.5 text-center text-base font-semibold transition-colors ${btn}`}
              >
                Order {tier.quantity} magnets
              </Link>
            </article>
          );
        })}
      </div>

      {/* Larger orders */}
      <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-surface px-6 py-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-charcoal">Need more than {BASE_PACK_QTY} magnets?</p>
          <p className="text-sm text-muted">
            Order up to {MAX_QUANTITY} — each extra magnet is just{" "}
            <span className="font-bold text-terracotta">
              {CURRENCY_SYMBOL}
              {EXTRA_MAGNET_PRICE}
            </span>
            .
          </p>
        </div>
        <Link
          href="/products/custom-magnets?qty=24"
          className="shrink-0 rounded-full border border-terracotta px-5 py-2 text-sm font-semibold text-terracotta transition-colors hover:bg-terracotta hover:text-onaccent"
        >
          Choose a custom amount
        </Link>
      </div>
      <p className="mt-6 text-sm text-muted">
        Free design preview · Cash on delivery at no extra charge · Damaged on arrival? We replace it.
      </p>
    </section>
  );
}
