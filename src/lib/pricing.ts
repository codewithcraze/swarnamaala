// Central source of truth for product pricing so the UI and the backend
// always agree on the amount charged for a given quantity.

export type PricingTier = {
  quantity: number;
  price: number; // all-inclusive price in INR for the whole pack
  label: string;
  badge?: string;
  perPiece: number;
};

export const PRICING_TIERS: PricingTier[] = [
  { quantity: 6, price: 299, label: "6 Magnets", perPiece: 50 },
  { quantity: 12, price: 499, label: "12 Magnets", badge: "Popular", perPiece: 42 },
  { quantity: 18, price: 699, label: "18 Magnets", badge: "Best Value", perPiece: 39 },
];

// The smallest pack we sell. Orders below this are not allowed.
export const MIN_QUANTITY = 6;

// For quantities above 18, each additional magnet is charged at this rate
// on top of the 18-pack base price.
export const EXTRA_MAGNET_PRICE = 39;
export const BASE_PACK_QTY = 18;
export const BASE_PACK_PRICE = 699;

// GST has been removed — prices are all-inclusive. Kept as 0 so any legacy
// reference stays valid without adding tax.
export const GST_RATE = 0;

// Cash on Delivery has no extra charge — same price as online payment.
export const COD_FEE = 0;

// Customers can order up to 50 magnets in a single order.
export const MAX_QUANTITY = 50;

// Display-only discount shown on product prices ("₹374 ₹299 · 20% off").
// The selling price never changes; the struck-through "original" price is
// derived so that taking this percentage off it gives exactly the real price.
// Set to 0 to hide the strike-through everywhere.
export const DISPLAY_DISCOUNT_PCT = 20;

export function compareAtPrice(price: number): number | null {
  if (!DISPLAY_DISCOUNT_PCT || price <= 0) return null;
  return Math.round(price / (1 - DISPLAY_DISCOUNT_PCT / 100));
}

export const CURRENCY = "INR";
export const CURRENCY_SYMBOL = "\u20B9";

export function getTier(quantity: number): PricingTier | undefined {
  return PRICING_TIERS.find((t) => t.quantity === quantity);
}

// Returns a human label for any allowed quantity.
export function quantityLabel(quantity: number): string {
  const tier = getTier(quantity);
  if (tier) return tier.label;
  return `${quantity} Magnets`;
}

// All-inclusive subtotal for a given quantity. Returns null for quantities we
// don't offer (below the 6-pack minimum, above the max, or a fixed pack).
export function computeSubtotal(quantity: number): number | null {
  if (
    !Number.isInteger(quantity) ||
    quantity < MIN_QUANTITY ||
    quantity > MAX_QUANTITY
  ) {
    return null;
  }
  const tier = getTier(quantity);
  if (tier) return tier.price;
  if (quantity > BASE_PACK_QTY) {
    return BASE_PACK_PRICE + (quantity - BASE_PACK_QTY) * EXTRA_MAGNET_PRICE;
  }
  // Quantities between fixed tiers (e.g. 7-11, 13-17) fall back to the next
  // lower pack's price plus extra magnets so every allowed amount has a price.
  const lower = [...PRICING_TIERS]
    .filter((t) => t.quantity <= quantity)
    .sort((a, b) => b.quantity - a.quantity)[0];
  if (lower) {
    return lower.price + (quantity - lower.quantity) * EXTRA_MAGNET_PRICE;
  }
  return null;
}

export type PriceBreakdown = {
  quantity: number;
  subtotal: number;
  gst: number;
  total: number;
};

// Full price breakdown. Never trust prices from the client — always recompute
// from the quantity on the server. Prices are all-inclusive (no GST).
export function computePricing(quantity: number): PriceBreakdown | null {
  const subtotal = computeSubtotal(quantity);
  if (subtotal === null) return null;
  return { quantity, subtotal, gst: 0, total: subtotal };
}

export function isAllowedQuantity(quantity: number): boolean {
  return computeSubtotal(quantity) !== null;
}

// Referral reward earned by the referrer once a referred order is delivered.
// Tiers are based on the order total (see referral rules).
export function referralReward(orderTotal: number): number {
  if (orderTotal >= 699) return 49;
  if (orderTotal >= 499) return 39;
  if (orderTotal >= 299) return 29;
  return 0;
}
