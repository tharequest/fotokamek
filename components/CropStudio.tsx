"use client";

import { useEffect, useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  ScanFace,
  TriangleAlert,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Wand2,
  ZoomIn,
  ImageOff,
  CheckCircle2,
} from "lucide-react";
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
type CropSource = "auto" | "original";

interface CropStudioProps {
  imageSrc: string;
  onConfirm: (finalPhoto: string) => void;
  onChangePhoto: () => void;
}

const INITIAL_CROP = { x: 0, y: 0 };
const INITIAL_ZOOM = 1; // ga perlu trik zoom lagi — slack geser sekarang beneran ada dari hasil extractRegion

export default function CropStudio({ imageSrc, onConfirm, onChangePhoto }: CropStudioProps) {
  const [autoCropSrc, setAutoCropSrc] = useState<string | null>(null);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("detecting");
  const [cropSource, setCropSource] = useState<CropSource>("auto");
  const [crop, setCrop] = useState(INITIAL_CROP);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Rect | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setFaceStatus("detecting");
      setAutoCropSrc(null);
      setCropSource("auto");
      setCrop(INITIAL_CROP);
      setZoom(INITIAL_ZOOM);
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

  // balik ke foto ASLI (belum di-precrop sama auto-detect), biar bebas atur dari 0
  function handleResetToOriginal() {
    setCropSource("original");
    setCrop(INITIAL_CROP);
    setZoom(INITIAL_ZOOM);
    setCroppedAreaPixels(null);
  }

  // balik lagi ke hasil auto-crop yang awal (ga perlu deteksi ulang, udah ke-cache)
  function handleBackToAuto() {
    setCropSource("auto");
    setCrop(INITIAL_CROP);
    setZoom(INITIAL_ZOOM);
    setCroppedAreaPixels(null);
  }

  const activeImage = cropSource === "original" ? imageSrc : autoCropSrc;

  async function handleGenerate() {
    if (!activeImage || !croppedAreaPixels) return;
    setGenerating(true);
    try {
      const finalPhoto = await getCroppedImg(
        activeImage,
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
        <div className="crop-container relative overflow-hidden rounded-2xl">
          {activeImage ? (
            <>
              <Cropper
                image={activeImage}
                crop={crop}
                zoom={zoom}
                aspect={PHOTO_ASPECT}
                cropShape="rect"
                showGrid={true}
                objectFit={cropSource === "original" ? "contain" : "cover"}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
              {/* garis panduan batas kepala atas — dekoratif, ga ikut kegeser/kezoom,
                  cuma patokan visual buat naik-turunin foto */}
              <div
                className="pointer-events-none absolute inset-x-0 z-10 flex items-center gap-1.5"
                style={{ top: "8%" }}
              >
                <span className="whitespace-nowrap rounded-full border-[2px] border-ink bg-white px-2 py-0.5 text-[10px] font-semibold text-ink shadow-pop-sm">
                  Batas kepala atas
                </span>
                <div className="h-0 flex-1 border-t-2 border-dashed border-white/90" />
              </div>
            </>
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
        {cropSource === "original" ? (
          <div className="flex items-center gap-2 rounded-2xl border-[3px] border-ink bg-sky px-4 py-3 text-sm font-semibold text-ink block-shadow-sm">
            <ImageOff className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            Mode manual — crop dari foto asli utuh, atur bebas dari 0
          </div>
        ) : (
          <>
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
          </>
        )}

        <div className="rounded-2xl border-[3px] border-ink bg-white p-4 text-sm block-shadow-sm">
          <p className="font-display font-semibold text-ink mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-mint" strokeWidth={2.5} />
            Contoh foto yang benar
          </p>
          <div className="grid grid-cols-3 gap-2">
            <img
              src="/contoh-foto-1.jpg"
              alt="Contoh foto yang benar 1"
              className="aspect-[2/3] w-full rounded-lg border-[2px] border-ink object-cover"
            />
            <img
              src="/contoh-foto-2.jpg"
              alt="Contoh foto yang benar 2"
              className="aspect-[2/3] w-full rounded-lg border-[2px] border-ink object-cover"
            />
            <img
              src="/contoh-foto-3.jpg"
              alt="Contoh foto yang benar 3"
              className="aspect-[2/3] w-full rounded-lg border-[2px] border-ink object-cover"
            />
          </div>
          <p className="mt-2 text-xs text-ink/50">
            Wajah menghadap depan, bahu simetris, badan tegak
          </p>
        </div>

        <div className="rounded-2xl border-[3px] border-ink bg-white p-4 text-sm text-ink/70 block-shadow-sm">
          <p className="font-display font-semibold text-ink mb-1">Tips crop</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Geser foto ke segala arah pakai jari/mouse langsung di atas fotonya</li>
            <li>Pakek slider zoom kalau butuh ruang lebih buat digeser</li>
            <li>Pas-in bagian atas kepala pas/dikit di bawah garis putus-putus "Batas kepala atas"</li>
            <li>Pastikan kepalak same bahu keliatan penuh dalam kotak</li>
            {cropSource === "auto" && (
              <li>Kalau hasil auto-crop kepotong ga pas, klik "Reset ke Foto Asli"</li>
            )}
          </ul>
        </div>

        <button
          onClick={handleBackToAuto}
          disabled={!autoCropSrc || cropSource === "auto"}
          className="flex items-center justify-center gap-2 rounded-full bg-violet px-6 py-3.5 font-display text-base font-semibold text-white border-[3px] border-ink block-shadow-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Wand2 className="h-5 w-5" strokeWidth={2.5} />
          Crop Otomatis Lagi ✨
        </button>

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
          {generating ? "Memproses..." : "Simpan & Download"}
        </button>

        <button
          onClick={handleResetToOriginal}
          disabled={!imageSrc || cropSource === "original"}
          className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-ink border-[3px] border-ink block-shadow-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
          Reset ke Foto Asli
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