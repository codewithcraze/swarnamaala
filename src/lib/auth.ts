import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Please define the JWT_SECRET environment variable in .env.local");
}

const secret = new TextEncoder().encode(JWT_SECRET);
export const AUTH_COOKIE = "sm_token";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE}s`)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload }: { payload: JWTPayload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      name: (payload.name as string) ?? "",
      email: (payload.email as string) ?? "",
    };
  } catch {
    return null;
  }
}

// Sets the auth cookie (httpOnly) after login/registration.
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// Reads and validates the session from the request cookies.
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
