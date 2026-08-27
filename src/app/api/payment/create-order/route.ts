import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { getSessionUser } from "@/lib/auth";
import {
  createRazorpayOrder,
  getPublicKeyId,
  type RazorpayApiError,
} from "@/lib/razorpay-api";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please sign in to pay." }, { status: 401 });
  }

  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required." }, { status: 400 });
    }

    await connectToDatabase();

    const order = await Order.findOne({ _id: orderId, user: session.id });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.paymentStatus === "paid") {
      return NextResponse.json({ error: "This order is already paid." }, { status: 409 });
    }
    if (order.paymentMethod === "cod") {
      return NextResponse.json(
        { error: "This is a Cash on Delivery order." },
        { status: 400 }
      );
    }

    // Amount in paise (Razorpay uses the smallest currency unit).
    const amountPaise = Math.round(order.total * 100);

    const rzpOrder = await createRazorpayOrder({
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${order._id.toString().slice(-12)}`,
      notes: {
        siteOrderId: order._id.toString(),
        customerName: order.shippingAddress?.fullName ?? "",
        customerPhone: order.shippingAddress?.phone ?? "",
      },
    });

    // Persist the Razorpay order ID so we can verify the signature later.
    order.razorpayOrderId = rzpOrder.id;
    // A fresh attempt supersedes any earlier failure on this order.
    if (order.paymentStatus === "failed") {
      order.paymentStatus = "unpaid";
      order.paymentFailureReason = undefined;
      order.paymentFailedAt = undefined;
    }
    await order.save();

    return NextResponse.json({
      rzpOrderId: rzpOrder.id,
      amount: amountPaise,
      currency: "INR",
      keyId: getPublicKeyId(),
      // Pre-fill details for the Razorpay modal.
      prefill: {
        name: order.shippingAddress?.fullName ?? "",
        contact: order.shippingAddress?.phone ?? "",
        email: session.email,
      },
      notes: rzpOrder.notes,
    });
  } catch (err) {
    const e = err as RazorpayApiError;
    console.error("create-order error", {
      message: e?.message,
      statusCode: e?.statusCode,
      code: e?.code,
    });

    if (e?.code === "CONFIG_MISSING") {
      return NextResponse.json(
        { error: "Payment gateway is not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Credentials rejected: a server misconfiguration the customer cannot fix.
    if (e?.statusCode === 401) {
      console.error(
        "[razorpay] Authentication failed. Verify RAZORPAYAPIKEY / " +
          "RAZORPAYSECRETKEY match a live key pair in the Razorpay dashboard. " +
          `Loaded key_id: ${process.env.RAZORPAYAPIKEY ?? "(unset)"}`
      );
      return NextResponse.json(
        { error: "Payment gateway is misconfigured. Please contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Could not create payment. Please try again." },
      { status: 500 }
    );
  }
}
