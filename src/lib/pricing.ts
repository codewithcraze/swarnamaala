// Central source of truth for product pricing so the UI and the backend
// always agree on the amount charged for a given quantity.

export type PricingTier = {
  quantity: number;
  price: number; // pre-GST price in INR for the whole pack
  label: string;
  badge?: string;
  perPiece: number;
};

export const PRICING_TIERS: PricingTier[] = [
  { quantity: 1, price: 99, label: "1 Magnet", perPiece: 99 },
  { quantity: 3, price: 249, label: "3 Magnets", badge: "Popular", perPiece: 83 },
  { quantity: 6, price: 449, label: "6 Magnets", perPiece: 75 },
  { quantity: 10, price: 699, label: "10 Magnets", badge: "Best Value", perPiece: 70 },
];

// For quantities above 10, each additional magnet is charged at this rate
// on top of the 10-pack base price.
export const EXTRA_MAGNET_PRICE = 70;
export const BASE_PACK_QTY = 10;
export const BASE_PACK_PRICE = 699;

// GST has been removed — prices are all-inclusive. Kept as 0 so any legacy
// reference stays valid without adding tax.
export const GST_RATE = 0;

// Flat fee added for Cash on Delivery orders. Online payments have no fee.
export const COD_FEE = 49;

export const MAX_QUANTITY = 100;

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

// Pre-GST subtotal for a given quantity. Returns null for quantities we don't
// offer (only fixed packs 1/3/6/10 or any custom amount above 10 are allowed).
export function computeSubtotal(quantity: number): number | null {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return null;
  }
  const tier = getTier(quantity);
  if (tier) return tier.price;
  if (quantity > BASE_PACK_QTY) {
    return BASE_PACK_PRICE + (quantity - BASE_PACK_QTY) * EXTRA_MAGNET_PRICE;
  }
  return null;
}

export type PriceBreakdown = {
  quantity: number;
  subtotal: number;
  gst: number;
  total: number;
};

// Full price breakdown (subtotal + 18% GST). Never trust prices from the
// client, always recompute from the quantity on the server.
export function computePricing(quantity: number): PriceBreakdown | null {
  const subtotal = computeSubtotal(quantity);
  if (subtotal === null) return null;
  // No GST — the total equals the subtotal.
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
  if (orderTotal >= 399) return 29;
  return 0;
}
