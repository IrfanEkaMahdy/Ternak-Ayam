# Ternak Ayam Petelur

Aplikasi web pribadi untuk memantau ternak ayam petelur lokal: **Ayam Kampung Petelur**, **Ayam KUB-2 Petelur**, dan **Ayam Elba Petelur**.

Dibuat sebagai PWA (Progressive Web App) tanpa server: bisa dipasang di HP Android seperti aplikasi biasa, **jalan online maupun offline**, dan seluruh data tersimpan di perangkat sendiri.

## Fitur

- **Kandang / batch** — beberapa kelompok ayam sekaligus dengan jenis, jumlah, dan tanggal menetas berbeda. Umur dihitung otomatis setiap hari.
- **Pakan** — kebutuhan gram/ekor/hari sesuai jenis dan fase umur (starter → grower → developer → pra-layer → layer), total kg per hari/minggu/bulan, perkiraan biaya, dan jumlah karung 50 kg per bulan.
- **Vaksin** — jadwal otomatis dari umur ayam (Marek, ND-IB, Gumboro, AI, Fowl Pox, Coryza, ND-EDS-IB pra-produksi, ND rutin masa produksi, obat cacing berkala) lengkap dengan cara pemberian, penanda terlambat/hari ini/akan datang, dan centang bila sudah dikerjakan.
- **Telur** — pencatatan harian telur, kematian, dan pakan terpakai; HDP harian, rata-rata 7 hari, grafik 14 hari terakhir, serta perkiraan pendapatan.
- **Panduan pemula** — rekomendasi otomatis sesuai fase umur batch, perbandingan antar jenis ayam, dan tanda-tanda ayam bermasalah.
- **Cadangan data** — ekspor/impor file `.json` untuk pindah HP atau berjaga-jaga.

## Cara memakai di HP Android

1. Aktifkan GitHub Pages untuk repositori ini (Settings → Pages → Source: **GitHub Actions**). Setelah workflow selesai, alamatnya: `https://irfanekamahdy.github.io/Ternak-Ayam/`
2. Buka alamat tersebut di Chrome HP.
3. Menu ⋮ → **Tambahkan ke layar utama / Install app**.
4. Buka dari ikon di layar utama. Setelah dibuka sekali dengan internet, aplikasi tetap bisa dipakai penuh saat offline.

Alternatif tanpa internet sama sekali: salin seluruh folder ini ke penyimpanan HP, lalu buka `index.html` dengan browser (fitur inti tetap jalan, hanya mode terpasang/PWA yang tidak aktif).

## Menjalankan di komputer

```bash
python3 -m http.server 8000
# buka http://localhost:8000
```

Tidak ada dependensi, tidak ada proses build.

## Struktur

```
index.html               Kerangka halaman + navigasi tab
assets/css/style.css     Tampilan (mobile-first, mendukung mode gelap)
assets/js/standards.js   Tabel pakan, jadwal vaksin, panduan per fase
assets/js/storage.js     Penyimpanan lokal (localStorage) + ekspor/impor
assets/js/hitung.js      Perhitungan umur, pakan, jadwal vaksin, HDP
assets/js/ui.js          Render tiap tab dan penanganan form
sw.js                    Service worker (mode offline)
manifest.webmanifest     Metadata PWA
```

## Catatan

Angka pakan, jadwal vaksin, dan target produksi adalah **acuan umum lapangan**, bukan resep baku. Sesuaikan dengan kondisi kandang, iklim, kualitas pakan, dan anjuran mantri ternak/dinas peternakan setempat. Data disimpan hanya di browser perangkat — menghapus data situs Chrome akan menghapus catatan, jadi unduh cadangan secara berkala.
