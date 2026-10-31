import { SignJWT, jwtVerify } from "jose";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { bearerToken } from "@/lib/marketplace";

// Guest checkout: customers can upload photos, place and pay for an order
// without signing in. Two short-lived signed tokens stand in for the session:
//  - an upload token, issued on the product page, lets a guest upload photos;
//  - an order token, issued when the order is created, lets that guest pay for
//    exactly that one order (create-order / verify / failed).
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
const UPLOAD_SCOPE = "guest-upload";
const ORDER_SCOPE = "guest-order";

export async function createGuestUploadToken(): Promise<string> {
  return new SignJWT({ scope: UPLOAD_SCOPE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("6h")
    .sign(secret);
}

export async function verifyGuestUploadToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.scope === UPLOAD_SCOPE;
  } catch {
    return false;
  }
}

export async function createOrderToken(orderId: string): Promise<string> {
  return new SignJWT({ scope: ORDER_SCOPE, oid: orderId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

async function orderIdFromToken(token: string | null | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.scope === ORDER_SCOPE && typeof payload.oid === "string" ? payload.oid : null;
  } catch {
    return null;
  }
}

export type OrderAccess =
  | { kind: "session"; session: SessionUser; filter: Record<string, unknown> }
  | { kind: "guest"; filter: Record<string, unknown> };

// Who may act on `orderId`: the signed-in owner, or a guest holding the order
// token for this order. Returns the Mongo filter to load the order with.
export async function orderAccess(request: Request, orderId: string): Promise<OrderAccess | null> {
  const tokenOrderId = await orderIdFromToken(bearerToken(request));
  if (tokenOrderId && tokenOrderId === String(orderId)) {
    return { kind: "guest", filter: { _id: orderId } };
  }
  const session = await getSessionUser();
  if (session) return { kind: "session", session, filter: { _id: orderId, user: session.id } };
  return null;
}
