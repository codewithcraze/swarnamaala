import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";

// Marketplace orders: customers who bought on Meesho/Flipkart/Amazon etc. send
// their photos through a public link without signing up.

import { isPlatform, type PlatformId } from "@/lib/platforms";
export { PLATFORMS, MAX_MARKETPLACE_QTY, platformLabel, isPlatform, type PlatformId } from "@/lib/platforms";

// Platform order ids are compared case-insensitively and without spaces.
export function normalizeOrderId(raw: unknown) {
  return String(raw ?? "").trim().replace(/\s+/g, "").toUpperCase();
}
export const ORDER_ID_RE = /^[A-Z0-9_\-\/#]{4,40}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Upload token -----------------------------------------------------------
// A short-lived signed token issued after the details step. It lets a guest
// upload photos and submit exactly this one order, without a login session.
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
const SCOPE = "marketplace-upload";

export type MarketplaceClaim = {
  name: string;
  email: string;
  phone: string;
  platform: PlatformId;
  externalOrderId: string;
};

export async function createUploadToken(claim: MarketplaceClaim): Promise<string> {
  return new SignJWT({ ...claim, scope: SCOPE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("3h")
    .sign(secret);
}

export async function verifyUploadToken(token: string | null | undefined): Promise<MarketplaceClaim | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.scope !== SCOPE || !isPlatform(payload.platform)) return null;
    return {
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      phone: String(payload.phone ?? ""),
      platform: payload.platform,
      externalOrderId: String(payload.externalOrderId ?? ""),
    };
  } catch {
    return null;
  }
}

export function bearerToken(request: Request) {
  const h = request.headers.get("authorization") ?? "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : null;
}

// Readable random password: no look-alike characters, 12 chars.
export function generatePassword(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
