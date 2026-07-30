import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { createToken, setAuthCookie } from "@/lib/auth";
import { generateUniqueReferralCode } from "@/lib/referral";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");
    const refCode = String(body.ref ?? "").trim().toUpperCase();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Resolve the referrer from the referral code, if provided.
    let referredBy = null;
    if (refCode) {
      const referrer = await User.findOne({ referralCode: refCode }).lean<{ _id: unknown }>();
      if (referrer) referredBy = referrer._id;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const referralCode = await generateUniqueReferralCode();
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      referralCode,
      referredBy,
    });

    const token = await createToken({ id: user._id.toString(), name, email });
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: user._id.toString(), name, email, phone },
    });
  } catch (err) {
    console.error("register error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
