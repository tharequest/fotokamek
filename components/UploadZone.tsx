"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, UploadCloud } from "lucide-react";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
}

export default function UploadZone({ onFileSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith("image/")) return;
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={`group cursor-pointer rounded-3xl border-[3px] border-dashed p-10 sm:p-14 text-center transition-colors ${
        isDragging
          ? "border-violet bg-violet/10"
          : "border-ink/30 bg-white hover:border-violet"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow border-[3px] border-ink block-shadow-sm">
        <UploadCloud className="h-8 w-8 text-ink" strokeWidth={2.5} />
      </div>

      <p className="font-display text-xl sm:text-2xl font-semibold text-ink">
        Seret foto ke sitok e, atau klik untok pilih
      </p>
      <p className="mt-2 text-sm sm:text-base text-ink/60">
        Landscape, potret, ukuran ape ajak - semue bise. Format JPG / PNG.
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper block-shadow-hover">
        <ImagePlus className="h-4 w-4" strokeWidth={2.5} />
        Pilih Fotonye
      </div>
    </div>
  );
}
