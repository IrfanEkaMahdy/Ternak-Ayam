/* Standar pemeliharaan ayam petelur lokal: kebutuhan pakan, vaksin, dan target produksi.
   Angka merupakan acuan umum lapangan; sesuaikan dengan kondisi kandang dan kualitas pakan. */

const BREEDS = {
  kampung: {
    id: 'kampung',
    nama: 'Ayam Kampung Petelur',
    mulaiBertelurHari: 168, // ~24 minggu
    puncakHdp: 45,
    bobotDewasaGram: 1600,
    pakan: [
      { sampaiMinggu: 2, gram: 10, fase: 'Starter', protein: '20-21%' },
      { sampaiMinggu: 4, gram: 20, fase: 'Starter', protein: '20-21%' },
      { sampaiMinggu: 6, gram: 30, fase: 'Grower', protein: '17-18%' },
      { sampaiMinggu: 8, gram: 40, fase: 'Grower', protein: '17-18%' },
      { sampaiMinggu: 12, gram: 50, fase: 'Grower', protein: '17-18%' },
      { sampaiMinggu: 16, gram: 60, fase: 'Developer', protein: '16-17%' },
      { sampaiMinggu: 20, gram: 70, fase: 'Pra-Layer', protein: '16-17%' },
      { sampaiMinggu: 999, gram: 80, fase: 'Layer', protein: '16-17% + Ca 3,5%' }
    ]
  },
  kub2: {
    id: 'kub2',
    nama: 'Ayam KUB-2 Petelur',
    mulaiBertelurHari: 154, // ~22 minggu
    puncakHdp: 50,
    bobotDewasaGram: 1700,
    pakan: [
      { sampaiMinggu: 2, gram: 11, fase: 'Starter', protein: '20-21%' },
      { sampaiMinggu: 4, gram: 22, fase: 'Starter', protein: '20-21%' },
      { sampaiMinggu: 6, gram: 32, fase: 'Grower', protein: '17-18%' },
      { sampaiMinggu: 8, gram: 42, fase: 'Grower', protein: '17-18%' },
      { sampaiMinggu: 12, gram: 52, fase: 'Grower', protein: '17-18%' },
      { sampaiMinggu: 16, gram: 62, fase: 'Developer', protein: '16-17%' },
      { sampaiMinggu: 20, gram: 72, fase: 'Pra-Layer', protein: '16-17%' },
      { sampaiMinggu: 999, gram: 80, fase: 'Layer', protein: '16-17% + Ca 3,5%' }
    ]
  },
  elba: {
    id: 'elba',
    nama: 'Ayam Elba Petelur',
    mulaiBertelurHari: 147, // ~21 minggu
    puncakHdp: 60,
    bobotDewasaGram: 1900,
    pakan: [
      { sampaiMinggu: 2, gram: 12, fase: 'Starter', protein: '20-22%' },
      { sampaiMinggu: 4, gram: 24, fase: 'Starter', protein: '20-22%' },
      { sampaiMinggu: 6, gram: 35, fase: 'Grower', protein: '17-18%' },
      { sampaiMinggu: 8, gram: 45, fase: 'Grower', protein: '17-18%' },
      { sampaiMinggu: 12, gram: 55, fase: 'Grower', protein: '17-18%' },
      { sampaiMinggu: 16, gram: 68, fase: 'Developer', protein: '16-17%' },
      { sampaiMinggu: 20, gram: 78, fase: 'Pra-Layer', protein: '16-17%' },
      { sampaiMinggu: 999, gram: 85, fase: 'Layer', protein: '17% + Ca 3,5-4%' }
    ]
  }
};

/* Jadwal vaksin & program kesehatan dasar. hari = umur ayam saat aplikasi.
   ulangHari > 0 berarti diulang setiap sekian hari sampai ayam diafkir. */
const JADWAL_VAKSIN = [
  { kode: 'marek', hari: 1, nama: 'Marek', cara: 'Suntik subkutan leher', catatan: 'Umumnya sudah dilakukan di hatchery. Tanyakan ke penjual DOC.' },
  { kode: 'nd-ib-1', hari: 4, nama: 'ND + IB (aktif)', cara: 'Tetes mata / hidung', catatan: 'Vaksin wajib pertama. Lakukan pagi hari saat udara sejuk.' },
  { kode: 'ai-1', hari: 7, nama: 'AI (Flu Burung, killed)', cara: 'Suntik subkutan 0,2 ml', catatan: 'Dianjurkan bila daerah endemis flu burung.' },
  { kode: 'gumboro-1', hari: 14, nama: 'Gumboro / IBD', cara: 'Air minum atau tetes mulut', catatan: 'Puasakan air 1-2 jam agar vaksin habis dalam 2 jam.' },
  { kode: 'nd-ib-2', hari: 21, nama: 'ND + IB (aktif) ulangan', cara: 'Air minum', catatan: 'Gunakan air tanpa kaporit, tambahkan susu skim 2 gr/liter.' },
  { kode: 'gumboro-2', hari: 28, nama: 'Gumboro ulangan', cara: 'Air minum', catatan: 'Opsional, dilakukan bila kasus gumboro tinggi di sekitar kandang.' },
  { kode: 'pox', hari: 35, nama: 'Fowl Pox (cacar)', cara: 'Tusuk sayap (wing web)', catatan: 'Cek 5-7 hari setelahnya, harus ada keropeng kecil tanda vaksin jadi.' },
  { kode: 'nd-killed', hari: 42, nama: 'ND killed (inaktif)', cara: 'Suntik subkutan 0,5 ml', catatan: 'Membentuk kekebalan jangka panjang menjelang dewasa.' },
  { kode: 'coryza-1', hari: 56, nama: 'Coryza (snot)', cara: 'Suntik intramuskular 0,5 ml', catatan: 'Penting di daerah lembap / musim hujan.' },
  { kode: 'coryza-2', hari: 84, nama: 'Coryza ulangan', cara: 'Suntik intramuskular 0,5 ml', catatan: 'Booster sebelum masuk masa produksi.' },
  { kode: 'ai-2', hari: 84, nama: 'AI ulangan', cara: 'Suntik subkutan 0,5 ml', catatan: 'Booster flu burung.' },
  { kode: 'nd-eds-ib', hari: 112, nama: 'ND + EDS + IB (killed)', cara: 'Suntik intramuskular 0,5 ml', catatan: 'Vaksin pra-produksi, mencegah penurunan kualitas telur.' },
  { kode: 'nd-rutin', hari: 140, nama: 'ND aktif rutin masa produksi', cara: 'Air minum', catatan: 'Diulang rutin selama ayam berproduksi.', ulangHari: 60 },
  { kode: 'cacing', hari: 60, nama: 'Obat cacing', cara: 'Air minum / cekok', catatan: 'Bukan vaksin, tapi wajib. Diulang tiap 3 bulan.', ulangHari: 90 }
];

/* Panduan per fase umur untuk peternak pemula. */
const PANDUAN_FASE = [
  {
    nama: 'Fase Brooding (umur 0-14 hari)',
    dariHari: 0, sampaiHari: 14,
    poin: [
      'Suhu indukan 32-35 °C di minggu 1, turunkan ~2 °C tiap minggu. Ayam menyebar merata = suhu pas; bergerombol = kedinginan.',
      'Beri air gula 2-3% + vitamin pada 2 jam pertama DOC datang, baru berikan pakan.',
      'Pakan starter halus (crumble) diberikan sedikit-sedikit 5-6 kali sehari agar selalu segar.',
      'Kepadatan 40-50 ekor/m² pada minggu 1, litter sekam kering 5-8 cm.',
      'Cahaya 24 jam pada 3 hari pertama supaya anak ayam belajar makan dan minum.'
    ]
  },
  {
    nama: 'Fase Starter Akhir (umur 15-28 hari)',
    dariHari: 15, sampaiHari: 28,
    poin: [
      'Lebar indukan diperluas, kepadatan turun jadi 20-25 ekor/m².',
      'Mulai kurangi pemanas secara bertahap, lepas total sekitar umur 21-28 hari.',
      'Timbang sampel 10% populasi tiap minggu untuk mengecek keseragaman bobot (target ≥ 80% seragam).',
      'Jaga litter tetap kering, balik sekam yang menggumpal agar amonia tidak naik.'
    ]
  },
  {
    nama: 'Fase Grower (umur 29-84 hari)',
    dariHari: 29, sampaiHari: 84,
    poin: [
      'Ganti ke pakan grower protein 17-18%, pemberian 2 kali sehari (pagi & sore).',
      'Kepadatan 8-10 ekor/m², sediakan tempat bertengger.',
      'Hindari ayam kegemukan: kontrol pakan sesuai standar, ayam terlalu gemuk telat bertelur.',
      'Pisahkan ayam jantan bila tujuan hanya telur konsumsi.',
      'Berikan hijauan / sayuran cacah sebagai pelengkap, maksimal 10% dari total pakan.'
    ]
  },
  {
    nama: 'Fase Developer & Pra-Layer (umur 85-140 hari)',
    dariHari: 85, sampaiHari: 140,
    poin: [
      'Siapkan sarang bertelur (kotak 30x30x30 cm) satu untuk 4-5 ekor sejak umur ±16 minggu.',
      'Mulai umur 16-17 minggu naikkan kalsium bertahap ke pakan pra-layer.',
      'Tambah pencahayaan bertahap sampai 14-16 jam/hari untuk merangsang bertelur.',
      'Lakukan vaksin pra-produksi (ND+EDS+IB) sebelum ayam mulai bertelur.'
    ]
  },
  {
    nama: 'Fase Produksi (umur > 140 hari)',
    dariHari: 141, sampaiHari: 99999,
    poin: [
      'Pakan layer protein 16-17% dengan kalsium 3,5-4%, berikan sebagian pakan sore hari untuk pembentukan kerabang.',
      'Ambil telur minimal 2-3 kali sehari agar bersih dan tidak dierami/dipatuk.',
      'Catat HDP harian. Penurunan HDP mendadak > 10% = tanda penyakit atau stres, segera cek.',
      'Air minum harus selalu tersedia; kekurangan air 2 jam saja bisa menurunkan produksi beberapa hari.',
      'Afkir ayam yang tidak produktif (jengger pucat & kering, jarak tulang pubis sempit).'
    ]
  }
];

const TIPS_PEMULA = [
  'Mulai dari jumlah kecil (50-100 ekor) sampai paham pola pakan, penyakit, dan pasar telur.',
  'Biaya pakan = 60-70% total biaya. Catat pakan setiap hari, di situ untung-rugi ditentukan.',
  'Terapkan biosekuriti sederhana: alas kaki khusus kandang, jangan sembarang orang masuk, kandang karantina untuk ayam sakit.',
  'Jangan campur ayam dengan umur berbeda dalam satu kandang (all-in all-out per kandang).',
  'Simpan telur di tempat sejuk, ujung tumpul di atas; telur konsumsi tahan ±2 minggu di suhu ruang.',
  'Siapkan dana cadangan pakan minimal 1 bulan sebelum ayam mulai bertelur, karena 5 bulan pertama hanya pengeluaran.'
];
