import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { computePricing, quantityLabel, referralReward, CURRENCY, COD_FEE } from "@/lib/pricing";
import { isValidUploadUrl } from "@/lib/s3";
import { Coupon } from "@/models/Coupon";
import { evaluateCoupon, type CouponLike } from "@/lib/coupon";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const orders = await Order.find({ user: session.id })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("orders GET error", err);
    return NextResponse.json({ error: "Failed to load orders." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { error: "Please sign in to place an order." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const quantity = Number(body.quantity);
    const images: string[] = Array.isArray(body.images) ? body.images.map(String) : [];
    const note = String(body.note ?? "").trim();
    const address = body.shippingAddress ?? {};

    // Always compute price from the server-side pricing table.
    const pricing = computePricing(quantity);
    if (!pricing) {
      return NextResponse.json(
        { error: "Please choose a valid quantity (1, 3, 6, 10 or more)." },
        { status: 400 }
      );
    }

    // One image per magnet: the number of photos must match the quantity.
    if (images.length !== quantity) {
      return NextResponse.json(
        {
          error: `Please add ${quantity} ${quantity === 1 ? "photo" : "photos"} for your order.`,
        },
        { status: 400 }
      );
    }

    if (!images.every((url) => isValidUploadUrl(url))) {
      return NextResponse.json(
        { error: "Please upload your photos before placing the order." },
        { status: 400 }
      );
    }

    const required = ["fullName", "phone", "line1", "city", "state", "pincode"] as const;
    for (const field of required) {
      if (!String(address[field] ?? "").trim()) {
        return NextResponse.json(
          { error: "Please complete your shipping address." },
          { status: 400 }
        );
      }
    }

    if (!/^\d{6}$/.test(String(address.pincode).trim())) {
      return NextResponse.json({ error: "Please enter a valid 6-digit pincode." }, { status: 400 });
    }

    await connectToDatabase();

    // Payment method: "online" (Razorpay) or "cod" (pay on delivery, +COD_FEE).
    const paymentMethod = body.paymentMethod === "cod" ? "cod" : "online";

    // Apply a coupon if one was provided. The discount is always recomputed
    // server-side from the trusted coupon document.
    let couponCode: string | null = null;
    let discount = 0;
    let afterDiscount = pricing.total;
    const rawCoupon = String(body.couponCode ?? "").trim().toUpperCase();
    if (rawCoupon) {
      const coupon = (await Coupon.findOne({ code: rawCoupon }).lean()) as CouponLike | null;
      const result = evaluateCoupon(coupon, {
        subtotal: pricing.subtotal,
        total: pricing.total,
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      couponCode = rawCoupon;
      discount = result.discount;
      afterDiscount = result.finalTotal;
    }

    // COD fee is added after any coupon discount. Online payments have no fee.
    const codFee = paymentMethod === "cod" ? COD_FEE : 0;
    const finalTotal = afterDiscount + codFee;

    // Referral snapshot: if this buyer was referred, record the referrer and
    // the reward they will earn once this order is delivered.
    const buyer = await User.findById(session.id).lean<{ referredBy?: unknown }>();
    const referrer = buyer?.referredBy ?? null;
    const reward = referrer ? referralReward(afterDiscount) : 0;

    const order = await Order.create({
      user: session.id,
      product: "Custom Photo Magnet",
      quantity,
      unitLabel: quantityLabel(quantity),
      subtotal: pricing.subtotal,
      gst: pricing.gst,
      total: finalTotal,
      amount: finalTotal,
      currency: CURRENCY,
      couponCode,
      discount,
      paymentMethod,
      codFee,
      images,
      note,
      shippingAddress: {
        fullName: String(address.fullName).trim(),
        phone: String(address.phone).trim(),
        line1: String(address.line1).trim(),
        line2: String(address.line2 ?? "").trim(),
        city: String(address.city).trim(),
        state: String(address.state).trim(),
        pincode: String(address.pincode).trim(),
      },
      referrer,
      referralReward: reward,
      referralCredited: false,
    });

    return NextResponse.json({
      order: {
        id: order._id.toString(),
        total: finalTotal,
        quantity,
        discount,
        couponCode,
        paymentMethod,
        codFee,
      },
    });
  } catch (err) {
    console.error("orders POST error", err);
    return NextResponse.json({ error: "Failed to place order. Please try again." }, { status: 500 });
  }
}
