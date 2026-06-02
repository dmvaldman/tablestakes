// Downscale a captured photo to a reasonably-sized JPEG before OCR/display.
// Phone cameras produce huge multi-MB images; ~1600px on the long edge keeps
// receipt text legible at a fraction of the bytes. Returns a
// `data:image/jpeg;base64,...` URL.

async function loadDrawable(
  file: File,
): Promise<{ src: CanvasImageSource; width: number; height: number; close?: () => void }> {
  // createImageBitmap can apply EXIF orientation so rotated shots come out
  // upright; fall back to an <img> if unavailable.
  if ("createImageBitmap" in window) {
    try {
      const bmp = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        src: bmp,
        width: bmp.width,
        height: bmp.height,
        close: () => bmp.close(),
      };
    } catch {
      /* fall through */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    return {
      src: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

export async function downscaleToJpeg(
  file: File,
  maxDim = 1600,
  quality = 0.8,
): Promise<string> {
  const { src, width, height, close } = await loadDrawable(file);
  try {
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d canvas context");
    ctx.drawImage(src, 0, 0, w, h);

    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    close?.();
  }
}
