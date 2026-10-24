import * as THREE from "three";

// Loads a photo as a magnet texture that is:
// - decoded asynchronously (img.decode) so it doesn't block the main thread,
// - cover-cropped to the magnet's exact aspect ratio (no stretching),
// - downscaled to a small canvas so the GPU upload is cheap (no UI freeze).
// Results are cached so the same photo/aspect is only processed once.
const cache = new Map<string, Promise<THREE.Texture>>();

export function loadMagnetTexture(src: string, aspect: number, maxSize = 512): Promise<THREE.Texture> {
  const key = `${src}|${aspect.toFixed(3)}|${maxSize}`;
  let promise = cache.get(key);
  if (promise) return promise;

  promise = (async () => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    await img.decode();

    const W = aspect >= 1 ? maxSize : Math.round(maxSize * aspect);
    const H = aspect >= 1 ? Math.round(maxSize / aspect) : maxSize;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");

    // Cover-crop: fill the magnet face, trimming the overflow evenly.
    const r = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const dw = img.naturalWidth * r;
    const dh = img.naturalHeight * r;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  })();

  cache.set(key, promise);
  promise.catch(() => cache.delete(key));
  return promise;
}
