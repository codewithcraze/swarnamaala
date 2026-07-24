import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  try {
    await connectToDatabase();
    const user = await User.findById(session.id).lean<{
      _id: unknown;
      name: string;
      email: string;
      phone?: string;
    }>();
    if (!user) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
      },
    });
  } catch (err) {
    console.error("me error", err);
    return NextResponse.json({ user: null });
  }
}
