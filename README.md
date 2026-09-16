# FotoPas - Generator Foto 4x6

Aplikasi web buat generate foto ijazah ukuran 4x6 cm dari foto apapun yang
diupload mahasiswa (landscape, portrait, ukuran bebas). Auto-crop pakai
deteksi wajah AI (jalan 100% di browser, ga kirim foto ke server manapun),
bisa disesuaikan manual, dan bisa generate lembar cetak A4 isi banyak foto
sekaligus.

## Cara jalanin

\`\`\`bash
npm install
npm run dev
\`\`\`

Buka http://localhost:3000

Buat production build:

\`\`\`bash
npm run build
npm run start
\`\`\`

## Cara kerja singkat

1. **Upload** - foto apapun, orientasi/ukuran bebas.
2. **Auto-crop** - face-api.js (tiny face detector, model ada di
   `public/models/`, sudah di-bundle jadi ga butuh internet saat runtime)
   nyari wajah, lalu `lib/imageProcessing.ts` ngitung area crop awal
   ala foto setengah badan (headroom di atas, ruang buat bahu di bawah).
   Kalau wajah ga kedetect, fallback ke center-crop.
3. **Adjust manual** - pakai `react-easy-crop` buat geser/zoom.
4. **Generate** - di-crop & di-resize ke kanvas resolusi tinggi
   (1200x1800 px, rasio 4x6 asli 2:3).
5. **Lembar cetak (opsional)** - nyusun beberapa foto ukuran fisik asli
   (4x6 cm @ 300 DPI) di kanvas A4 lengkap garis potong, siap diprint.

## Struktur

\`\`\`
app/            halaman & layout (Next.js App Router)
components/     UploadZone, CropStudio, ResultPanel
lib/            faceDetect.ts, imageProcessing.ts (logic crop & cetak)
public/models/  model AI face-api.js (tiny face detector)
\`\`\`

## Catatan

- Target rasio foto: **4x6 cm asli (2:3)** - bukan rasio kotak upload
  SIAKAD (yang ternyata ~3:4), karena sistem kampus sendiri yang
  meng-crop & mengompres ulang saat upload.
- Font (Space Grotesk & Plus Jakarta Sans) di-self-host di `app/fonts/`
  biar build ga bergantung koneksi ke Google Fonts.
- Semua proses (deteksi wajah, crop, generate lembar cetak) jalan di
  browser pakai Canvas API - ga ada foto yang diupload ke server mana pun.
