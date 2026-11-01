import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import {
  createUploadToken,
  isPlatform,
  normalizeOrderId,
  ORDER_ID_RE,
  EMAIL_RE,
  usesPlatformOrderId,
  generateOrderId,
} from "@/lib/marketplace";

// Step 1 of the marketplace photo page: validate the customer's details and the
// platform order id, then return a short-lived token for uploading photos.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim().slice(0, 80);
    const platform = String(body.platform ?? "");

    if (name.length < 2) return bad("Please enter your full name.");
    if (!isPlatform(platform)) return bad("Please choose where you bought from.");

    // Meesho / Flipkart / Amazon: the customer gives the platform's order ID
    // and nothing else. Other platforms: we make up the order ID and take an
    // email so we can confirm the order and create their account.
    const withPlatformId = usesPlatformOrderId(platform);
    let externalOrderId: string;
    let email = "";
    let phone = "";
    if (withPlatformId) {
      externalOrderId = normalizeOrderId(body.externalOrderId);
      if (!ORDER_ID_RE.test(externalOrderId)) return bad("Please enter the order ID exactly as shown on the platform.");
      await connectToDatabase();
      const existing = await Order.findOne({ source: platform, externalOrderId }).select("_id").lean();
      if (existing) {
        return bad("Photos for this order ID have already been submitted. Contact us on WhatsApp if you need to change them.", 409);
      }
    } else {
      email = String(body.email ?? "").trim().toLowerCase();
      phone = String(body.phone ?? "").trim().slice(0, 20);
      if (!EMAIL_RE.test(email)) return bad("Please enter a valid email address.");
      externalOrderId = generateOrderId();
    }

    const token = await createUploadToken({ name, email, phone, platform, externalOrderId });
    return NextResponse.json({ token, externalOrderId, generatedOrderId: !withPlatformId });
  } catch (err) {
    console.error("marketplace start error", err);
    return bad("Something went wrong. Please try again.", 500);
  }
}

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}
