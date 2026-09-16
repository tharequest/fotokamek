"use client";

import { useEffect, useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { ScanFace, TriangleAlert, Loader2, RefreshCw, Sparkles, ZoomIn } from "lucide-react";
import { detectFaceBox } from "@/lib/faceDetect";
import {
  PHOTO_ASPECT,
  computeAutoCropRect,
  extractRegion,
  getCroppedImg,
  loadImageElement,
  SINGLE_OUTPUT_WIDTH,
  SINGLE_OUTPUT_HEIGHT,
  type Rect,
} from "@/lib/imageProcessing";

type FaceStatus = "detecting" | "detected" | "not-detected";

interface CropStudioProps {
  imageSrc: string;
  onConfirm: (finalPhoto: string) => void;
  onChangePhoto: () => void;
}

export default function CropStudio({ imageSrc, onConfirm, onChangePhoto }: CropStudioProps) {
  const [autoCropSrc, setAutoCropSrc] = useState<string | null>(null);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("detecting");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Rect | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setFaceStatus("detecting");
      setAutoCropSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);

      const imgEl = await loadImageElement(imageSrc);
      if (cancelled) return;

      let face = null;
      try {
        face = await detectFaceBox(imgEl);
      } catch {
        face = null;
      }
      if (cancelled) return;

      const rect = computeAutoCropRect(imgEl.naturalWidth, imgEl.naturalHeight, face);
      const region = await extractRegion(imageSrc, rect);
      if (cancelled) return;

      setAutoCropSrc(region);
      setFaceStatus(face ? "detected" : "not-detected");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleGenerate() {
    if (!autoCropSrc || !croppedAreaPixels) return;
    setGenerating(true);
    try {
      const finalPhoto = await getCroppedImg(
        autoCropSrc,
        croppedAreaPixels,
        SINGLE_OUTPUT_WIDTH,
        SINGLE_OUTPUT_HEIGHT
      );
      onConfirm(finalPhoto);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-3xl border-[3px] border-ink bg-white p-3 block-shadow">
        <div className="crop-container overflow-hidden rounded-2xl">
          {autoCropSrc ? (
            <Cropper
              image={autoCropSrc}
              crop={crop}
              zoom={zoom}
              aspect={PHOTO_ASPECT}
              cropShape="rect"
              showGrid={true}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-ink/60">
              <Loader2 className="h-8 w-8 animate-spin text-violet" />
              <p className="font-medium">Menyiapkan crop otomatis...</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3 px-1">
          <ZoomIn className="h-4 w-4 shrink-0 text-ink/50" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink/10 accent-violet"
            aria-label="Zoom"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {faceStatus === "detecting" && (
          <div className="flex items-center gap-2 rounded-2xl border-[3px] border-ink bg-white px-4 py-3 text-sm font-semibold block-shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-violet" />
            Mendeteksi muke...
          </div>
        )}
        {faceStatus === "detected" && (
          <div className="flex items-center gap-2 rounded-2xl border-[3px] border-ink bg-lime px-4 py-3 text-sm font-semibold text-ink block-shadow-sm">
            <ScanFace className="h-4 w-4" strokeWidth={2.5} />
            Muke terdeteksi otomatis - tinggal sesuaikan sikit yak kalau perlu
          </div>
        )}
        {faceStatus === "not-detected" && (
          <div className="flex items-center gap-2 rounded-2xl border-[3px] border-ink bg-yellow px-4 py-3 text-sm font-semibold text-ink block-shadow-sm">
            <TriangleAlert className="h-4 w-4" strokeWidth={2.5} />
            Muke ndaan kedetect otomatis tok, jadinye atur posisinye manual ye
          </div>
        )}

        <div className="rounded-2xl border-[3px] border-ink bg-white p-4 text-sm text-ink/70 block-shadow-sm">
          <p className="font-display font-semibold text-ink mb-1">Tips crop</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Geser foto mun nak ngatur posisi</li>
            <li>Pakek slider atau scroll mun nak nge-zoom</li>
            <li>Pastikan kepalak  same bahu keliatan penuh dalam kotak</li>
          </ul>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!croppedAreaPixels || generating}
          className="flex items-center justify-center gap-2 rounded-full bg-violet px-6 py-3.5 font-display text-base font-semibold text-white border-[3px] border-ink block-shadow-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" strokeWidth={2.5} />
          )}
          {generating ? "Memproses..." : "Generate Foto 4x6"}
        </button>

        <button
          onClick={onChangePhoto}
          className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-ink border-[3px] border-ink block-shadow-hover"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
          Ganti Fotonye
        </button>
      </div>
    </div>
  );
}
