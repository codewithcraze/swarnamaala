import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { getSessionUser } from "@/lib/auth";

/**
 * POST /api/payment/failed
 * Called by the client when a Razorpay payment fails or is dismissed.
 * Marks the order's paymentStatus as "failed" so it shows up in the CRM.
 */
export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const { orderId, reason, razorpayPaymentId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const order = await Order.findOne({ _id: orderId, user: session.id });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Only mark as failed if it hasn't already been paid
    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "This order is already paid." },
        { status: 409 }
      );
    }

    order.paymentStatus = "failed";
    order.paymentFailedAt = new Date();
    order.paymentFailureReason = String(reason || "Payment cancelled or failed by user.").slice(0, 500);
    // Record the Razorpay payment id when the failure came from an actual
    // payment.failed event (not just a dismissed modal).
    if (razorpayPaymentId) {
      order.razorpayPaymentId = String(razorpayPaymentId);
    }
    await order.save();

    return NextResponse.json({ ok: true, paymentStatus: "failed" });
  } catch (err) {
    console.error("payment/failed error", err);
    return NextResponse.json(
      { error: "Could not record payment failure." },
      { status: 500 }
    );
  }
}
