import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { getSessionUser } from "@/lib/auth";
import { getTier, isValidOrderPricing, CURRENCY } from "@/lib/pricing";
import { isValidUploadUrl } from "@/lib/s3";

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

    const tier = getTier(quantity);
    if (!tier) {
      return NextResponse.json({ error: "Please choose a valid quantity." }, { status: 400 });
    }

    // Always compute price from the server-side pricing table.
    const amount = tier.price;
    if (typeof body.amount !== "undefined" && !isValidOrderPricing(quantity, Number(body.amount))) {
      return NextResponse.json({ error: "Pricing mismatch detected." }, { status: 400 });
    }

    // One image per magnet: the number of photos must match the pack size.
    if (images.length !== tier.quantity) {
      return NextResponse.json(
        {
          error: `Please add ${tier.quantity} ${
            tier.quantity === 1 ? "photo" : "photos"
          } for your ${tier.label}.`,
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
    const order = await Order.create({
      user: session.id,
      product: "Custom Fridge Magnet",
      quantity: tier.quantity,
      unitLabel: tier.label,
      amount,
      currency: CURRENCY,
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
    });

    return NextResponse.json({ order: { id: order._id.toString(), amount, quantity: tier.quantity } });
  } catch (err) {
    console.error("orders POST error", err);
    return NextResponse.json({ error: "Failed to place order. Please try again." }, { status: 500 });
  }
}
