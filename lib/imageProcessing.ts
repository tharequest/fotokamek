import type { FaceBox } from "./faceDetect";

/** True physical ratio of a 4x6 cm photo, width / height. */
export const PHOTO_ASPECT = 4 / 6;

/** High-resolution digital output (bigger than needed — the campus
 * system compresses on its end, so we oversample for a clean result). */
export const SINGLE_OUTPUT_WIDTH = 1200;
export const SINGLE_OUTPUT_HEIGHT = 1800;

const DPI = 300;
const cmToPx = (cm: number) => Math.round((cm / 2.54) * DPI);

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar"));
    img.src = src;
  });
}

/** Clamp a crop rectangle so it stays inside the source image, keeping
 * the 4:6 aspect ratio intact. */
function clampCropRect(rect: Rect, imgW: number, imgH: number): Rect {
  let { x, y, width, height } = rect;

  if (width > imgW) {
    const scale = imgW / width;
    width = imgW;
    height = height * scale;
  }
  if (height > imgH) {
    const scale = imgH / height;
    height = imgH;
    width = width * scale;
  }

  x = Math.min(Math.max(x, 0), imgW - width);
  y = Math.min(Math.max(y, 0), imgH - height);

  return { x, y, width, height };
}

/**
 * Computes a sensible starting crop for an ID-style half-body photo.
 * If a face box is available, the crop is built around it (headroom on
 * top, room for shoulders/chest below). Otherwise falls back to a
 * center-biased crop matching the 4:6 aspect ratio.
 */
export function computeAutoCropRect(
  imgW: number,
  imgH: number,
  face: FaceBox | null
): Rect {
  if (face) {
    const desiredFaceHeightRatio = 0.32; // face height vs crop height
    const topMarginRatio = 0.16; // headroom above the head

    let cropHeight = face.height / desiredFaceHeightRatio;
    let cropWidth = cropHeight * PHOTO_ASPECT;

    const faceCenterX = face.x + face.width / 2;
    let cropX = faceCenterX - cropWidth / 2;
    let cropY = face.y - topMarginRatio * cropHeight;

    return clampCropRect(
      { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
      imgW,
      imgH
    );
  }

  // No face detected — fall back to a center-ish crop with slight
  // top bias (most portraits have more headroom below than above).
  const imgAspect = imgW / imgH;
  let cropWidth: number;
  let cropHeight: number;
  let cropX: number;
  let cropY: number;

  if (imgAspect > PHOTO_ASPECT) {
    cropHeight = imgH;
    cropWidth = cropHeight * PHOTO_ASPECT;
    cropX = (imgW - cropWidth) / 2;
    cropY = 0;
  } else {
    cropWidth = imgW;
    cropHeight = cropWidth / PHOTO_ASPECT;
    cropX = 0;
    cropY = Math.max(0, (imgH - cropHeight) * 0.15);
  }

  return clampCropRect({ x: cropX, y: cropY, width: cropWidth, height: cropHeight }, imgW, imgH);
}

/** Draws a source region onto a standalone canvas and returns it as a
 * data URL — used to hand a pre-cropped starting image to the
 * interactive crop tool. */
export async function extractRegion(
  imageSrc: string,
  rect: Rect
): Promise<string> {
  const img = await loadImageElement(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.width));
  canvas.height = Math.max(1, Math.round(rect.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung");

  ctx.drawImage(
    img,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL("image/jpeg", 0.95);
}

/** Final crop + resize to the target output resolution. */
export async function getCroppedImg(
  imageSrc: string,
  crop: Rect,
  outputWidth = SINGLE_OUTPUT_WIDTH,
  outputHeight = SINGLE_OUTPUT_HEIGHT
): Promise<string> {
  const img = await loadImageElement(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return canvas.toDataURL("image/jpeg", 0.95);
}

export interface PrintGrid {
  cols: number;
  rows: number;
  maxCount: number;
  paperWidthPx: number;
  paperHeightPx: number;
}

/** Grid math for laying real-size 4x6cm photos on A4 paper at 300 DPI. */
export function calcPrintGrid(count: number): PrintGrid {
  const paperW = cmToPx(21);
  const paperH = cmToPx(29.7);
  const photoW = cmToPx(4);
  const photoH = cmToPx(6);
  const margin = cmToPx(1);
  const gap = cmToPx(0.5);

  const usableW = paperW - 2 * margin;
  const usableH = paperH - 2 * margin;

  const maxCols = Math.max(1, Math.floor((usableW + gap) / (photoW + gap)));
  const maxRows = Math.max(1, Math.floor((usableH + gap) / (photoH + gap)));
  const maxCount = maxCols * maxRows;

  const n = Math.min(Math.max(count, 1), maxCount);
  const cols = Math.min(maxCols, n);
  const rows = Math.ceil(n / cols);

  return { cols, rows, maxCount, paperWidthPx: paperW, paperHeightPx: paperH };
}

/** Composes N real-size (4x6cm @300dpi) copies of the photo onto an A4
 * sheet with dashed cut guides, centered on the page. */
export async function composePrintSheet(
  photoDataUrl: string,
  count: number
): Promise<string> {
  const paperW = cmToPx(21);
  const paperH = cmToPx(29.7);
  const photoW = cmToPx(4);
  const photoH = cmToPx(6);
  const margin = cmToPx(1);
  const gap = cmToPx(0.5);

  const { cols, rows, maxCount } = calcPrintGrid(count);
  const n = Math.min(count, maxCount);

  const gridW = cols * photoW + (cols - 1) * gap;
  const gridH = rows * photoH + (rows - 1) * gap;
  const startX = Math.max(margin, (paperW - gridW) / 2);
  const startY = Math.max(margin, (paperH - gridH) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = paperW;
  canvas.height = paperH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, paperW, paperH);

  const img = await loadImageElement(photoDataUrl);

  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (photoW + gap);
    const y = startY + row * (photoH + gap);

    ctx.drawImage(img, x, y, photoW, photoH);

    ctx.save();
    ctx.strokeStyle = "#c9c9c9";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 2, y - 2, photoW + 4, photoH + 4);
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.95);
}
