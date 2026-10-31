import { NextResponse } from "next/server";
import { createGuestUploadToken } from "@/lib/guest";

export const dynamic = "force-dynamic";

// Issues a short-lived token that lets a guest upload photos for an order.
export async function POST() {
  return NextResponse.json({ token: await createGuestUploadToken() }, { headers: { "Cache-Control": "no-store" } });
}
