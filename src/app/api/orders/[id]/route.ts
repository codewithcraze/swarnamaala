import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { getSessionUser } from "@/lib/auth";
import { computePricing, quantityLabel, referralReward } from "@/lib/pricing";
import { isValidUploadUrl } from "@/lib/s3";

type Ctx = { params: Promise<{ id: string }> };

// Orders can only be modified while they are still pending.
const EDITABLE_STATUS = "pending";

// GET a single order (used to pre-fill the edit form).
export async function GET(_request: Request, { params }: Ctx) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const order = await Order.findOne({ _id: id, user: session.id }).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (err) {
    console.error("order GET error", err);
    return NextResponse.json({ error: "Failed to load order." }, { status: 500 });
  }
}

// PATCH: edit an existing pending order (quantity, photos, shipping, note).
export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please sign in to edit your order." }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const quantity = Number(body.quantity);
    const images: string[] = Array.isArray(body.images) ? body.images.map(String) : [];
    const note = String(body.note ?? "").trim();
    const address = body.shippingAddress ?? {};

    const pricing = computePricing(quantity);
    if (!pricing) {
      return NextResponse.json(
        { error: "Please choose a valid quantity (1, 3, 6, 10 or more)." },
        { status: 400 }
      );
    }

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
        { error: "Please upload your photos before saving." },
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
    const order = await Order.findOne({ _id: id, user: session.id });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.status !== EDITABLE_STATUS) {
      return NextResponse.json(
        { error: `This order is already ${order.status} and can no longer be edited.` },
        { status: 409 }
      );
    }

    // Recompute the potential referral reward against the new total.
    const reward = order.referrer ? referralReward(pricing.total) : 0;

    order.set({
      quantity,
      unitLabel: quantityLabel(quantity),
      subtotal: pricing.subtotal,
      gst: pricing.gst,
      total: pricing.total,
      amount: pricing.total,
      // Editing recomputes the price from scratch; any previously applied
      // coupon is dropped and must be re-applied at checkout.
      couponCode: null,
      discount: 0,
      images,
      note,
      referralReward: reward,
      shippingAddress: {
        fullName: String(address.fullName).trim(),
        phone: String(address.phone).trim(),
        line1: String(address.line1).trim(),
        line2: String(address.line2 ?? "").trim(),
        city: String(address.city).trim(),
        state: String(address.state).trim(),
        pincode: String(address.pincode).trim(),
      },
    });
    await order.save();

    return NextResponse.json({ order: { id: order._id.toString(), total: pricing.total, quantity } });
  } catch (err) {
    console.error("order PATCH error", err);
    return NextResponse.json({ error: "Failed to update order. Please try again." }, { status: 500 });
  }
}

// DELETE: cancel a pending order.
export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const order = await Order.findOne({ _id: id, user: session.id });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.status !== EDITABLE_STATUS) {
      return NextResponse.json(
        { error: `This order is already ${order.status} and can no longer be cancelled.` },
        { status: 409 }
      );
    }

    order.status = "cancelled";
    await order.save();

    return NextResponse.json({ ok: true, status: "cancelled" });
  } catch (err) {
    console.error("order DELETE error", err);
    return NextResponse.json({ error: "Failed to cancel order. Please try again." }, { status: 500 });
  }
}
