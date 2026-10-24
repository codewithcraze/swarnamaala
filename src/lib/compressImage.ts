// Shrinks a photo in the browser before upload so it uploads fast on mobile data.
//
// Print maths: a 90 x 65 mm magnet at 300 dpi needs ~1063 x 768 px. We keep the
// long edge at up to 2400 px (well over 600 dpi), so quality is unaffected while
// a typical 4-8 MB phone photo becomes ~400-900 KB.
const MAX_EDGE = 2400;
const QUALITY = 0.88;
// Files already this small (and within MAX_EDGE) are uploaded untouched.
const SKIP_BELOW_BYTES = 900 * 1024;

export async function compressImage(file: File): Promise<File> {
  // Formats the browser can't decode (e.g. HEIC outside Safari) are sent as-is.
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) return file;

  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the EXIF rotation so portrait phone photos stay upright.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  if (scale === 1 && file.size <= SKIP_BELOW_BYTES) {
    bitmap.close();
    return file;
  }

  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  // Keep the original if compression somehow made it bigger.
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

// Uploads one file to /api/upload with real progress (fetch can't report upload
// progress, XHR can). Resolves to the stored image URL.
export function uploadWithProgress(
  file: File,
  onProgress: (fraction: number) => void,
  token?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      const data = xhr.response ?? {};
      if (xhr.status >= 200 && xhr.status < 300 && data.url) resolve(data.url as string);
      else reject(new Error(data.error ?? "Upload failed"));
    };
    xhr.onerror = () => reject(new Error("Network error — please check your connection."));
    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

// Runs async tasks with a concurrency limit (uploading 50 photos at once would
// choke a mobile connection; 3 in parallel keeps the pipe full but responsive).
export async function runLimited<T>(items: T[], limit: number, worker: (item: T, index: number) => Promise<void>) {
  let next = 0;
  const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await worker(items[i], i);
    }
  });
  await Promise.all(lanes);
}
