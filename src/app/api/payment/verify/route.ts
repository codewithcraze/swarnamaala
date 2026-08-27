import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Coupon } from "@/models/Coupon";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      await request.json();

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Missing required payment verification fields." },
        { status: 400 }
      );
    }

    // --- Signature verification ---
    // Razorpay signs the string `razorpay_order_id|razorpay_payment_id`
    // with the key secret using HMAC-SHA256.
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAYSECRETKEY!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json(
        { error: "Payment verification failed. Invalid signature." },
        { status: 400 }
      );
    }

    // --- Mark order as paid ---
    await connectToDatabase();
    const order = await Order.findOne({ _id: orderId, user: session.id });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json(
        { error: "Razorpay order ID mismatch." },
        { status: 400 }
      );
    }

    const wasAlreadyPaid = order.paymentStatus === "paid";

    order.paymentStatus = "paid";
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paidAt = new Date();
    await order.save();

    // Count the coupon usage once, when the order is first paid.
    if (!wasAlreadyPaid && order.couponCode) {
      await Coupon.updateOne(
        { code: order.couponCode },
        { $inc: { usedCount: 1 } }
      ).catch((e) => console.error("coupon usage increment failed", e));
    }

    return NextResponse.json({ ok: true, paymentId: razorpayPaymentId });
  } catch (err) {
    console.error("verify payment error", err);
    return NextResponse.json(
      { error: "Payment verification failed. Please contact support." },
      { status: 500 }
    );
  }
}
