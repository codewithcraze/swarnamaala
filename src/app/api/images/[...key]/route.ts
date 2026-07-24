import { NextResponse } from "next/server";
import { getS3Object } from "@/lib/s3";

type Ctx = { params: Promise<{ key: string[] }> };

// Streams a private S3 object back to the browser. Only keys under the
// "uploads/" prefix are allowed so this can't be used to read arbitrary objects.
export async function GET(_request: Request, { params }: Ctx) {
  const { key: parts } = await params;
  const key = (parts ?? []).join("/");

  if (!key.startsWith("uploads/") || key.includes("..")) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const object = await getS3Object(key);
  if (!object) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  return new NextResponse(Buffer.from(object.bytes), {
    status: 200,
    headers: {
      "Content-Type": object.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
