/* Perhitungan umur, kebutuhan pakan, jadwal vaksin, dan produksi telur. */

const MS_HARI = 86400000;

function tanggalHariIni() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function keTanggal(iso) {
  const d = new Date(iso + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoHariIni() {
  return formatIso(tanggalHariIni());
}

function formatIso(d) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function formatTanggal(iso) {
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = keTanggal(iso);
  return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
}

function tambahHari(iso, hari) {
  return formatIso(new Date(keTanggal(iso).getTime() + hari * MS_HARI));
}

function umurHari(batch, padaIso) {
  const acuan = padaIso ? keTanggal(padaIso) : tanggalHariIni();
  const selisih = Math.floor((acuan - keTanggal(batch.tglMenetas)) / MS_HARI);
  return selisih < 0 ? 0 : selisih;
}

function umurTeks(hari) {
  const minggu = Math.floor(hari / 7);
  const sisa = hari % 7;
  if (hari < 7) return hari + ' hari';
  return minggu + ' minggu' + (sisa ? ' ' + sisa + ' hari' : '');
}

function standarPakan(jenis, hari) {
  const breed = BREEDS[jenis] || BREEDS.kampung;
  const minggu = hari / 7;
  return breed.pakan.find((p) => minggu <= p.sampaiMinggu) || breed.pakan[breed.pakan.length - 1];
}

function kebutuhanPakanBatch(batch) {
  const hari = umurHari(batch);
  const std = standarPakan(batch.jenis, hari);
  const gramPerEkor = std.gram;
  const totalGram = gramPerEkor * (batch.jumlah || 0);
  return {
    umurHari: hari,
    gramPerEkor,
    fase: std.fase,
    protein: std.protein,
    totalGram,
    totalKg: totalGram / 1000,
    mingguanKg: (totalGram * 7) / 1000,
    bulananKg: (totalGram * 30) / 1000
  };
}

function jadwalVaksinBatch(batch, horizonHari) {
  const umur = umurHari(batch);
  const batas = umur + (horizonHari === undefined ? 60 : horizonHari);
  const hasil = [];
  JADWAL_VAKSIN.forEach((v) => {
    let hari = v.hari;
    let putaran = 0;
    while (hari <= Math.max(batas, v.hari)) {
      const kunci = v.kode + '@' + hari;
      const tanggal = tambahHari(batch.tglMenetas, hari);
      const selesai = batch.vaksinSelesai && batch.vaksinSelesai[kunci];
      hasil.push({
        kunci,
        kode: v.kode,
        nama: v.nama + (putaran > 0 ? ' (ulangan ke-' + putaran + ')' : ''),
        cara: v.cara,
        catatan: v.catatan,
        hari,
        tanggal,
        selesai: selesai || null,
        status: selesai ? 'selesai' : hari < umur ? 'terlambat' : hari === umur ? 'hari-ini' : 'akan-datang',
        sisaHari: hari - umur
      });
      if (!v.ulangHari) break;
      hari += v.ulangHari;
      putaran += 1;
    }
  });
  hasil.sort((a, b) => a.hari - b.hari);
  return hasil;
}

function ringkasanTelur(catatanBatch, jumlahAyam) {
  const total = catatanBatch.reduce((s, c) => s + (c.telur || 0), 0);
  const terakhir = catatanBatch[0];
  const hdp = terakhir && jumlahAyam ? (terakhir.telur / jumlahAyam) * 100 : 0;
  const tujuhHari = catatanBatch.slice(0, 7);
  const rata7 = tujuhHari.length ? tujuhHari.reduce((s, c) => s + (c.telur || 0), 0) / tujuhHari.length : 0;
  return {
    total,
    hdpTerakhir: hdp,
    rata7,
    hdpRata7: jumlahAyam ? (rata7 / jumlahAyam) * 100 : 0
  };
}

function fasePanduan(hari) {
  return PANDUAN_FASE.find((f) => hari >= f.dariHari && hari <= f.sampaiHari) || PANDUAN_FASE[PANDUAN_FASE.length - 1];
}

function rupiah(n) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

function angka(n, desimal) {
  return Number(n).toLocaleString('id-ID', {
    minimumFractionDigits: desimal || 0,
    maximumFractionDigits: desimal === undefined ? 1 : desimal
  });
}
