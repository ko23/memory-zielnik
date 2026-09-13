const DEFAULT_MAX_WIDTH = 480;
const JPEG_QUALITY = 0.75;

/**
 * Fetches an image URL and returns it as a resized, base64 JPEG data URL,
 * matching the compression settings used for the bundled seed cards
 * (see scripts/generate-herb-seed-data.mjs). Browser-only (uses <canvas>
 * and Image) — not meaningfully unit-testable under happy-dom, so this
 * is covered by manual verification instead (see plan.md).
 */
export async function urlToResizedDataUrl(
  url: string,
  maxWidth: number = DEFAULT_MAX_WIDTH,
): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("urlToResizedDataUrl: canvas 2d context unavailable");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
