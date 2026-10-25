import { CURRENCY_SYMBOL, DISPLAY_DISCOUNT_PCT, compareAtPrice } from "@/lib/pricing";

// Selling price with the struck-through original and a "20% off" badge.
// size: "lg" for pricing cards, "md" for pack tiles, "sm" for inline summaries.
export default function PriceTag({
  price,
  size = "md",
  className = "",
  priceClassName = "text-terracotta",
  wasClassName = "text-muted",
  badge = true,
}: {
  price: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  priceClassName?: string;
  wasClassName?: string;
  badge?: boolean;
}) {
  const was = compareAtPrice(price);
  const s = {
    sm: { now: "text-base", was: "text-xs", pill: "text-[10px] px-1.5 py-0" },
    md: { now: "text-lg", was: "text-xs", pill: "text-[10px] px-1.5 py-0.5" },
    lg: { now: "text-[46px] sm:text-[54px] leading-tight tracking-tight", was: "text-lg", pill: "text-xs px-2.5 py-0.5" },
  }[size];

  return (
    <span className={`inline-flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 ${className}`}>
      {was && (
        <s className={`${s.was} font-medium ${wasClassName} decoration-[1.5px]`} aria-label={`Original price ${CURRENCY_SYMBOL}${was}`}>
          {CURRENCY_SYMBOL}{was}
        </s>
      )}
      <span className={`${s.now} font-bold ${priceClassName}`}>
        {CURRENCY_SYMBOL}{price}
      </span>
      {was && badge && (
        <span className={`${s.pill} self-center rounded-full bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-400`}>
          {DISPLAY_DISCOUNT_PCT}% off
        </span>
      )}
    </span>
  );
}
