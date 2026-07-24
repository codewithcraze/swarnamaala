import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await createToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
      },
    });
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
