import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getSessionUser } from "@/lib/auth";
import { s3Configured, uploadToS3 } from "@/lib/s3";

// mongoose / aws-sdk need the Node.js runtime (not edge), and image uploads
// can take a little longer than the default limit.
export const runtime = "nodejs";
export const maxDuration = 120; // large images can take time

const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/heic", "heic"],
]);

export async function POST(request: Request) {
  // Only signed-in users can upload (uploads are tied to placing an order).
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please sign in to upload an image." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file was provided." }, { status: 400 });
    }

    const ext = ALLOWED.get(file.type);
    if (!ext) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a JPG, PNG or WebP image." },
        { status: 415 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Prefer S3 when configured; fall back to local disk for local dev.
    if (s3Configured) {
      const url = await uploadToS3(bytes, file.type, ext);
      return NextResponse.json({ url });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
    await writeFile(path.join(uploadDir, filename), bytes);
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error("upload error", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
