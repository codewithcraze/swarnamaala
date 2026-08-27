// Shared coupon validation + discount computation. The rupee discount is always
// computed server-side from a trusted coupon document and the server-computed
// pricing, never from anything the client sends.

export type CouponLike = {
  code: string;
  type: "percent" | "flat";
  value: number;
  maxDiscount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  usedCount?: number;
  active?: boolean;
  expiresAt?: Date | string | null;
};

export type CouponEvaluation =
  | { ok: true; discount: number; finalTotal: number }
  | { ok: false; error: string };

// Applies a coupon to a pre-computed price breakdown.
// - minOrderValue is checked against the pre-GST subtotal.
// - the discount is applied to the total (subtotal + GST) and can never exceed it.
export function evaluateCoupon(
  coupon: CouponLike | null | undefined,
  pricing: { subtotal: number; total: number }
): CouponEvaluation {
  if (!coupon) return { ok: false, error: "Coupon not found." };

  if (coupon.active === false) {
    return { ok: false, error: "This coupon is no longer active." };
  }

  if (coupon.expiresAt) {
    const exp = new Date(coupon.expiresAt).getTime();
    if (Number.isFinite(exp) && exp < Date.now()) {
      return { ok: false, error: "This coupon has expired." };
    }
  }

  if (
    coupon.usageLimit &&
    coupon.usageLimit > 0 &&
    (coupon.usedCount ?? 0) >= coupon.usageLimit
  ) {
    return { ok: false, error: "This coupon has reached its usage limit." };
  }

  if (coupon.minOrderValue && pricing.subtotal < coupon.minOrderValue) {
    return {
      ok: false,
      error: `Add more to reach the minimum order of \u20B9${coupon.minOrderValue} for this coupon.`,
    };
  }

  let discount = 0;
  if (coupon.type === "percent") {
    discount = Math.round((pricing.total * coupon.value) / 100);
    if (coupon.maxDiscount && coupon.maxDiscount > 0) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    // flat rupee off
    discount = Math.round(coupon.value);
  }

  // Never discount below zero, and never more than the order total.
  discount = Math.max(0, Math.min(discount, pricing.total));

  if (discount <= 0) {
    return { ok: false, error: "This coupon gives no discount on this order." };
  }

  return { ok: true, discount, finalTotal: pricing.total - discount };
}
