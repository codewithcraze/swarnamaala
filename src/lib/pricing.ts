// Central source of truth for product pricing so the UI and the backend
// always agree on the amount charged for a given quantity.

export type PricingTier = {
  quantity: number;
  price: number; // total price in INR for the whole pack
  label: string;
  badge?: string;
  perPiece: number;
};

export const PRICING_TIERS: PricingTier[] = [
  { quantity: 1, price: 99, label: "1 Magnet", perPiece: 99 },
  { quantity: 3, price: 199, label: "3 Magnets", badge: "Popular", perPiece: 66 },
  { quantity: 6, price: 399, label: "6 Magnets", perPiece: 67 },
  { quantity: 10, price: 499, label: "10 Magnets", badge: "Best Value", perPiece: 50 },
];

export function getTier(quantity: number): PricingTier | undefined {
  return PRICING_TIERS.find((t) => t.quantity === quantity);
}

// Validate a quantity + price pair coming from the client against our
// authoritative pricing table. Never trust prices sent by the browser.
export function isValidOrderPricing(quantity: number, price: number): boolean {
  const tier = getTier(quantity);
  return !!tier && tier.price === price;
}

export const CURRENCY = "INR";
export const CURRENCY_SYMBOL = "\u20B9";
