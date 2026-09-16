"use client";

import { useState } from "react";
import { Crop, ScanFace, MousePointerClick, Printer, Sparkles } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import CropStudio from "@/components/CropStudio";
import ResultPanel from "@/components/ResultPanel";

type Step = "upload" | "studio" | "result";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [finalPhoto, setFinalPhoto] = useState<string | null>(null);

  async function handleFileSelected(file: File) {
    const dataUrl = await fileToDataUrl(file);
    setOriginalImageSrc(dataUrl);
    setFinalPhoto(null);
    setStep("studio");
  }

  function handleConfirmCrop(photo: string) {
    setFinalPhoto(photo);
    setStep("result");
  }

  function reset() {
    setOriginalImageSrc(null);
    setFinalPhoto(null);
    setStep("upload");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b-[3px] border-ink bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet border-[3px] border-ink">
              <Crop className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold text-ink">FotoKamek</span>
          </div>
          <span className="hidden text-xs font-semibold text-ink/50 sm:inline">
            untok mahasiswa FMIPA UNTAN
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        {step === "upload" && (
          <>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-yellow px-3.5 py-1.5 text-xs font-semibold text-ink border-[3px] border-ink">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                Ade auto-crop pakai magic, langsung di browser
              </div>
              <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
                Foto ape ajak, pun jadi{" "}
                <span className="rounded-lg bg-violet px-2 text-white">4x6</span> sekali
                klik yak
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-ink/60">
                ndaan perlu edit manual agek ndaan perlu kestudio. Upload jak fotonye yang udah rapi,
                biar sistem yang nge-cropnye &amp; sung jadi ukuran 4x6.
              </p>
            </div>

            <UploadZone onFileSelected={handleFileSelected} />

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <FeatureCard
                icon={<ScanFace className="h-5 w-5 text-ink" strokeWidth={2.5} />}
                color="bg-lime"
                title="Auto deteksi muke kitak"
                desc="Posisi same crop awal diatur otomatis dari muke mu."
              />
              <FeatureCard
                icon={<MousePointerClick className="h-5 w-5 text-ink" strokeWidth={2.5} />}
                color="bg-sky"
                title="Bise disesuaikan"
                desc="Geser same zoom manual mun hasil auto belom pas."
              />
              <FeatureCard
                icon={<Printer className="h-5 w-5 text-ink" strokeWidth={2.5} />}
                color="bg-coral"
                title="Siap cetak banyak"
                desc="Suson beberapa foto 4x6 asli dalam satu lembar A4."
              />
            </div>
          </>
        )}

        {step === "studio" && originalImageSrc && (
          <CropStudio
            imageSrc={originalImageSrc}
            onConfirm={handleConfirmCrop}
            onChangePhoto={reset}
          />
        )}

        {step === "result" && finalPhoto && (
          <ResultPanel photoSrc={finalPhoto} onReset={reset} />
        )}
      </main>

      <footer className="border-t-[3px] border-ink py-6 text-center text-xs text-ink/50">
        Dibuat untokkan bantok mahasiswa/i FMIPA UNTAN mun bingung nak mengedit foto 4x6 ye. mun dah tau tak ape tak pake itok aman men.
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  color,
  title,
  desc,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border-[3px] border-ink bg-white p-5 block-shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color} border-[3px] border-ink`}>
        {icon}
      </div>
      <p className="font-display font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink/60">{desc}</p>
    </div>
  );
}
