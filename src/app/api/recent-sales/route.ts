import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { platformLabel } from "@/lib/platforms";

// Public, anonymised feed of genuine recent orders for the "someone just
// ordered" notification: first name + city (or platform) + pack size + time.
// No emails, surnames, addresses or order ids are exposed.
export const revalidate = 300; // cache for 5 minutes

type Row = {
  quantity: number;
  createdAt: Date;
  source?: string;
  shippingAddress?: { fullName?: string; city?: string };
  user?: { name?: string } | null;
};

export async function GET() {
  try {
    await connectToDatabase();
    void User; // ensure the User model is registered for populate
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rows = (await Order.find({
      createdAt: { $gte: since },
      status: { $ne: "cancelled" },
      // Real orders only: paid online, cash on delivery, or marketplace.
      $or: [{ paymentStatus: "paid" }, { paymentMethod: "cod" }],
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .select("quantity createdAt source shippingAddress.fullName shippingAddress.city user")
      .populate("user", "name")
      .lean()) as unknown as Row[];

    const sales = rows.map((r) => {
      const full = r.shippingAddress?.fullName || r.user?.name || "";
      const first = full.trim().split(/\s+/)[0] || "Someone";
      const market = r.source && r.source !== "website";
      return {
        name: first.charAt(0).toUpperCase() + first.slice(1).toLowerCase(),
        place: market ? `via ${platformLabel(r.source)}` : r.shippingAddress?.city ? `from ${r.shippingAddress.city}` : "",
        quantity: r.quantity,
        at: r.createdAt,
      };
    });
    return NextResponse.json({ sales });
  } catch (err) {
    console.error("recent-sales error", err);
    return NextResponse.json({ sales: [] });
  }
}
