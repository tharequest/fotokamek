"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Printer,
  Minus,
  Plus,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  calcPrintGrid,
  composePrintSheet,
  SINGLE_OUTPUT_WIDTH,
  SINGLE_OUTPUT_HEIGHT,
} from "@/lib/imageProcessing";

interface ResultPanelProps {
  photoSrc: string;
  onReset: () => void;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function ResultPanel({ photoSrc, onReset }: ResultPanelProps) {
  const maxCount = useMemo(() => calcPrintGrid(1).maxCount, []);
  const [printCount, setPrintCount] = useState(Math.min(6, maxCount));
  const [sheetSrc, setSheetSrc] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  async function handleCompose() {
    setComposing(true);
    try {
      const sheet = await composePrintSheet(photoSrc, printCount);
      setSheetSrc(sheet);
    } finally {
      setComposing(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid items-center gap-6 rounded-3xl border-[3px] border-ink bg-white p-6 block-shadow md:grid-cols-[auto_1fr]">
        <div
          className="mx-auto w-[160px] overflow-hidden rounded-xl border-[3px] border-ink"
          style={{ aspectRatio: "2 / 3" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc} alt="Foto 4x6 hasil crop" className="h-full w-full object-cover" />
        </div>

        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime px-3 py-1 text-xs font-semibold text-ink">
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
            Foto 4x6 dah siap
          </div>
          <h3 className="font-display text-xl font-semibold text-ink">
            Foto tunggal, resolusi tinggi
          </h3>
          <p className="mt-1 mb-4 text-sm text-ink/60">
            Rasio 4x6 cm asli · {SINGLE_OUTPUT_WIDTH}×{SINGLE_OUTPUT_HEIGHT}px - tinggal download atau nak disimpan.
          </p>
          <button
            onClick={() => downloadDataUrl(photoSrc, "foto-4x6.jpg")}
            className="inline-flex items-center gap-2 rounded-full bg-violet px-5 py-2.5 font-display text-sm font-semibold text-white border-[3px] border-ink block-shadow-hover"
          >
            <Download className="h-4 w-4" strokeWidth={2.5} />
            Download Foto
          </button>
        </div>
      </div>

      <div className="rounded-3xl border-[3px] border-ink bg-white p-6 block-shadow">
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky border-[3px] border-ink">
            <Printer className="h-4 w-4 text-ink" strokeWidth={2.5} />
          </div>
          <h3 className="font-display text-xl font-semibold text-ink">Mau cetak sekaligus?</h3>
        </div>
        <p className="mb-4 text-sm text-ink/60">
          Ade beberape foto 4x6 ukuran fisik asli disusun rapi dalam satu lembar A4 (300 DPI), lengkap
          garis potong putus-putusnye - tinggal print &amp; gunting.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <span className="text-sm font-semibold text-ink">Jumlahnye:</span>
          <div className="flex items-center gap-3 rounded-full border-[3px] border-ink px-2 py-1">
            <button
              onClick={() => setPrintCount((c) => Math.max(1, c - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-paper hover:bg-ink/10"
              aria-label="Kurangi"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
            <span className="w-6 text-center font-display font-semibold">{printCount}</span>
            <button
              onClick={() => setPrintCount((c) => Math.min(maxCount, c + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-paper hover:bg-ink/10"
              aria-label="Tambah"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
          </div>
          <span className="text-xs text-ink/50">maks {maxCount} lembar per A4</span>
        </div>

        <button
          onClick={handleCompose}
          disabled={composing}
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 font-display text-sm font-semibold text-white border-[3px] border-ink block-shadow-hover disabled:opacity-50"
        >
          {composing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Printer className="h-4 w-4" strokeWidth={2.5} />
          )}
          {composing ? "Menyusun lembar..." : "Buat Lembar Cetak"}
        </button>

        {sheetSrc && (
          <div className="grid gap-4 sm:grid-cols-[auto_1fr] items-center rounded-2xl border-[3px] border-ink bg-paper p-4">
            <div
              className="mx-auto w-[140px] overflow-hidden rounded-md border-[3px] border-ink bg-white"
              style={{ aspectRatio: "21 / 29.7" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sheetSrc} alt="Lembar cetak A4" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="mb-3 text-sm text-ink/70">
                Lembar A4 isinye {printCount} foto 4x6 ukuran fisik asli, siap dicetak di studio
                foto atau percetakan.
              </p>
              <button
                onClick={() => downloadDataUrl(sheetSrc, "lembar-cetak-4x6.jpg")}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-display text-sm font-semibold text-paper block-shadow-hover"
              >
                <Download className="h-4 w-4" strokeWidth={2.5} />
                Download Lembar Cetak
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onReset}
        className="mx-auto inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink border-[3px] border-ink block-shadow-hover"
      >
        <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
        Upload Foto Laing
      </button>
    </div>
  );
}
