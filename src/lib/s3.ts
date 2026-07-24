import crypto from "crypto";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const REGION = process.env.REGION ?? "us-east-1";
const BUCKET = process.env.BUCKETNAME ?? "";
const ACCESS_KEY = process.env.ACCESSKEY ?? "";
const SECRET_KEY = process.env.SECRETKEY ?? "";

// S3 is only used when all required env vars are present. Otherwise the
// upload route falls back to local disk storage.
export const s3Configured = Boolean(BUCKET && ACCESS_KEY && SECRET_KEY);

const s3 = s3Configured
  ? new S3Client({
      region: REGION,
      credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    })
  : null;

const KEY_PREFIX = "uploads/";

// Images are served back through our own /api/images proxy so the bucket can
// stay private (no public-read policy required) and URLs never expire.
const PROXY_BASE = "/api/images/";

export async function uploadToS3(
  body: Buffer,
  contentType: string,
  ext: string
): Promise<string> {
  if (!s3) throw new Error("S3 is not configured.");
  const key = `${KEY_PREFIX}${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  // Return an app-relative proxy URL, e.g. /api/images/uploads/<file>.
  return `${PROXY_BASE}${key}`;
}

export async function getS3Object(
  key: string
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  if (!s3) return null;
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    return { bytes, contentType: res.ContentType ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

// Validates that an image URL is one we actually produced: either a legacy
// local upload (/uploads/...) or an S3-backed proxy URL (/api/images/uploads/...).
export function isValidUploadUrl(url: unknown): boolean {
  if (typeof url !== "string" || url.length === 0) return false;
  if (url.startsWith("/uploads/")) return true;
  if (url.startsWith(`${PROXY_BASE}${KEY_PREFIX}`)) return true;
  return false;
}
