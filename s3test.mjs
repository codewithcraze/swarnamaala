const base = "http://localhost:3011";

// 1x1 PNG
const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function main() {
  // Register to get an auth cookie
  const email = `s3_${Math.floor(Math.random() * 1e9)}@example.com`;
  const reg = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "S3 Tester", email, password: "secret123" }),
  });
  const setCookie = reg.headers.get("set-cookie");
  const cookie = setCookie ? setCookie.split(";")[0] : "";
  console.log("REGISTER:", reg.status, "cookie:", cookie ? "yes" : "no");

  // Upload an image
  const bytes = Buffer.from(pngBase64, "base64");
  const fd = new FormData();
  fd.append("file", new Blob([bytes], { type: "image/png" }), "test.png");
  const up = await fetch(`${base}/api/upload`, {
    method: "POST",
    headers: { cookie },
    body: fd,
  });
  const upData = await up.json();
  console.log("UPLOAD:", up.status, JSON.stringify(upData));

  if (upData.url) {
    const fullUrl = upData.url.startsWith("http") ? upData.url : base + upData.url;
    const check = await fetch(fullUrl);
    const ct = check.headers.get("content-type");
    console.log("IMAGE_GET:", check.status, check.ok ? `OK (${ct})` : "FAILED");
  }
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
