import { DISPLAY_DISCOUNT_PCT, PRICING_TIERS, CURRENCY_SYMBOL } from "@/lib/pricing";

// Offers shown in the bottom-right popup. Edit this list to change what's
// promoted; set `active: false` to hide an offer without deleting it.
export type Offer = {
  id: string;
  title: string;
  detail: string;
  cta?: { label: string; href: string };
  active: boolean;
};

export const OFFERS: Offer[] = [
  {
    id: "launch-20",
    title: `${DISPLAY_DISCOUNT_PCT}% off every pack`,
    detail: `Packs now from ${CURRENCY_SYMBOL}${PRICING_TIERS[0].price}. Limited-time pricing.`,
    cta: { label: "Shop now", href: "/products/custom-magnets" },
    active: DISPLAY_DISCOUNT_PCT > 0,
  },
  {
    id: "cod-free",
    title: "Cash on delivery at no extra cost",
    detail: "Pay when your magnets arrive.",
    active: true,
  },
  {
    id: "free-shipping",
    title: "Free shipping across India",
    detail: "On every order, no minimum.",
    active: true,
  },
];

// Bump this when you change the offers so visitors who closed the popup see it again.
export const OFFERS_VERSION = "2026-10-a";
