import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Coupon } from "@/models/Coupon";
import { computePricing } from "@/lib/pricing";
import { evaluateCoupon, type CouponLike } from "@/lib/coupon";

// POST /api/coupons/validate  { code, quantity }
// Recomputes pricing from the quantity server-side, looks up the coupon, and
// returns the rupee discount + final total. Never trusts client-sent prices.
export async function POST(request: Request) {
  try {
    const { code, quantity } = await request.json();

    const cleanCode = String(code ?? "").trim().toUpperCase();
    if (!cleanCode) {
      return NextResponse.json({ error: "Enter a coupon code." }, { status: 400 });
    }

    const pricing = computePricing(Number(quantity));
    if (!pricing) {
      return NextResponse.json({ error: "Invalid order quantity." }, { status: 400 });
    }

    await connectToDatabase();
    const coupon = (await Coupon.findOne({ code: cleanCode }).lean()) as CouponLike | null;

    const result = evaluateCoupon(coupon, {
      subtotal: pricing.subtotal,
      total: pricing.total,
    });

    if (!result.ok || !coupon) {
      return NextResponse.json({ error: result.ok ? "Coupon not found." : result.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: cleanCode,
      type: coupon.type,
      value: coupon.value,
      discount: result.discount,
      subtotal: pricing.subtotal,
      gst: pricing.gst,
      originalTotal: pricing.total,
      finalTotal: result.finalTotal,
    });
  } catch (err) {
    console.error("coupon validate error", err);
    return NextResponse.json(
      { error: "Could not validate coupon. Please try again." },
      { status: 500 }
    );
  }
}
