import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { isValidUploadUrl } from "@/lib/s3";
import { generateUniqueReferralCode } from "@/lib/referral";
import { sendMail, marketplaceOrderEmail } from "@/lib/mail";
import {
  bearerToken,
  verifyUploadToken,
  generatePassword,
  platformLabel,
  MAX_MARKETPLACE_QTY,
} from "@/lib/marketplace";

// Step 2: create the order for a marketplace purchase. No login: the upload
// token from /api/marketplace/start identifies the customer and platform order.
// A customer account is created automatically (random password emailed) if the
// email is new; otherwise the order is added to their existing account.
export async function POST(request: Request) {
  const claim = await verifyUploadToken(bearerToken(request));
  if (!claim) {
    return NextResponse.json({ error: "Your session expired. Please start again." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const images: string[] = Array.isArray(body.images) ? body.images.map(String) : [];
    const note = String(body.note ?? "").trim().slice(0, 1000);
    const quantity = images.length;

    if (quantity < 1) return bad("Please add at least one photo.");
    if (quantity > MAX_MARKETPLACE_QTY) return bad(`You can add up to ${MAX_MARKETPLACE_QTY} photos.`);
    if (!images.every(isValidUploadUrl)) return bad("One or more photos are invalid. Please upload them again.");

    await connectToDatabase();

    // Re-check: someone may have submitted this order id since step 1.
    const dup = await Order.findOne({ source: claim.platform, externalOrderId: claim.externalOrderId }).select("_id").lean();
    if (dup) return bad("Photos for this order ID have already been submitted.", 409);

    // Find or create the customer account.
    let user = await User.findOne({ email: claim.email });
    let password: string | undefined;
    if (!user) {
      password = generatePassword();
      user = await User.create({
        name: claim.name,
        email: claim.email,
        phone: claim.phone || undefined,
        passwordHash: await bcrypt.hash(password, 12),
        referralCode: await generateUniqueReferralCode(),
      });
    }

    const platform = platformLabel(claim.platform);
    let order;
    try {
      order = await Order.create({
        user: user._id,
        product: "Custom Photo Magnet",
        quantity,
        unitLabel: `${quantity} Magnet${quantity > 1 ? "s" : ""} · ${platform}`,
        subtotal: 0,
        gst: 0,
        total: 0,
        amount: 0,
        currency: "INR",
        paymentMethod: "marketplace",
        // Paid on the selling platform; nothing to collect here.
        paymentStatus: "paid",
        source: claim.platform,
        externalOrderId: claim.externalOrderId,
        images,
        note: note || undefined,
      });
    } catch (e) {
      // Unique index on (source, externalOrderId) — a parallel submit won.
      if ((e as { code?: number }).code === 11000) return bad("Photos for this order ID have already been submitted.", 409);
      throw e;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://swarnamaala.in";
    const { subject, html } = marketplaceOrderEmail({
      name: claim.name,
      email: claim.email,
      platform,
      externalOrderId: claim.externalOrderId,
      quantity,
      password,
      siteUrl,
    });
    const mail = await sendMail({ to: claim.email, subject, html });

    return NextResponse.json({
      ok: true,
      orderId: order._id.toString(),
      accountCreated: Boolean(password),
      emailSent: mail.ok,
    });
  } catch (err) {
    console.error("marketplace order error", err);
    // Surface validation problems (e.g. a bad field) instead of a generic error.
    const e = err as { name?: string; errors?: Record<string, { message?: string }>; code?: number };
    if (e?.name === "ValidationError" && e.errors) {
      const msg = Object.values(e.errors).map((x) => x.message).filter(Boolean).join(" ");
      return bad(msg || "Some order details are invalid.", 400);
    }
    if (e?.code === 11000) return bad("This email or order ID is already in use.", 409);
    return bad("Could not save your order. Please try again.", 500);
  }
}

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}
