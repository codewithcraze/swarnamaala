import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import {
  createUploadToken,
  isPlatform,
  normalizeOrderId,
  ORDER_ID_RE,
  EMAIL_RE,
} from "@/lib/marketplace";

// Step 1 of the marketplace photo page: validate the customer's details and the
// platform order id, then return a short-lived token for uploading photos.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim().slice(0, 80);
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim().slice(0, 20);
    const platform = String(body.platform ?? "");
    const externalOrderId = normalizeOrderId(body.externalOrderId);

    if (name.length < 2) return bad("Please enter your full name.");
    if (!EMAIL_RE.test(email)) return bad("Please enter a valid email address.");
    if (!isPlatform(platform)) return bad("Please choose where you bought from.");
    if (!ORDER_ID_RE.test(externalOrderId)) return bad("Please enter the order ID exactly as shown on the platform.");

    await connectToDatabase();
    const existing = await Order.findOne({ source: platform, externalOrderId }).select("_id").lean();
    if (existing) {
      return bad("Photos for this order ID have already been submitted. Contact us on WhatsApp if you need to change them.", 409);
    }

    const token = await createUploadToken({ name, email, phone, platform, externalOrderId });
    return NextResponse.json({ token, externalOrderId });
  } catch (err) {
    console.error("marketplace start error", err);
    return bad("Something went wrong. Please try again.", 500);
  }
}

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}
