import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { getSessionUser } from "@/lib/auth";
import { generateUniqueReferralCode } from "@/lib/referral";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://swarnamaala.in";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Backfill a referral code for older accounts created before referrals.
    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
      await user.save();
    }

    const referredCount = await User.countDocuments({ referredBy: user._id });

    const referralOrders = await Order.find({ referrer: user._id })
      .sort({ createdAt: -1 })
      .populate("user", "name")
      .lean();

    let pending = 0;
    const credited = user.walletBalance ?? 0;
    const recent = referralOrders.map((o) => {
      const record = o as unknown as {
        _id: unknown;
        referralReward?: number;
        referralCredited?: boolean;
        status?: string;
        total?: number;
        amount?: number;
        createdAt?: Date;
        user?: { name?: string };
      };
      if (!record.referralCredited && record.status !== "cancelled") {
        pending += record.referralReward ?? 0;
      }
      return {
        id: String(record._id),
        friend: record.user?.name ?? "A friend",
        reward: record.referralReward ?? 0,
        status: record.status ?? "pending",
        credited: !!record.referralCredited,
        orderTotal: record.total ?? record.amount ?? 0,
        date: record.createdAt,
      };
    });

    return NextResponse.json({
      code: user.referralCode,
      referralUrl: `${SITE_URL}/signup?ref=${user.referralCode}`,
      walletBalance: credited,
      pending,
      referredCount,
      recent,
    });
  } catch (err) {
    console.error("referrals GET error", err);
    return NextResponse.json({ error: "Failed to load referrals." }, { status: 500 });
  }
}
