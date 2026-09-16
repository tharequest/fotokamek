import * as faceapi from "face-api.js";

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

/** Loads the tiny face detector model once (cached across calls). */
export async function ensureModelsLoaded(): Promise<void> {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = faceapi.nets.tinyFaceDetector
    .loadFromUri("/models")
    .then(() => {
      modelsLoaded = true;
    });

  return loadingPromise;
}

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Detects the most prominent face in an image element.
 * Returns null if no face is found (caller should fall back to a
 * sensible default crop).
 */
export async function detectFaceBox(
  image: HTMLImageElement
): Promise<FaceBox | null> {
  await ensureModelsLoaded();

  const detection = await faceapi.detectSingleFace(
    image,
    new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })
  );

  if (!detection) return null;

  const box = detection.box;
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}
