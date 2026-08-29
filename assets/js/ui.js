/* Antarmuka aplikasi: render tiap tab dan penanganan form. */

const konten = document.getElementById('konten');
let tabAktif = 'beranda';
let batchTerpilih = null;
let batchDiedit = null;

/* ---------- util ---------- */

function esc(teks) {
  return String(teks == null ? '' : teks).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function batchAktifId() {
  const s = getState();
  if (batchTerpilih && s.batches.some((b) => b.id === batchTerpilih)) return batchTerpilih;
  return s.batches.length ? s.batches[0].id : null;
}

function cariBatch(id) {
  return getState().batches.find((b) => b.id === id) || null;
}

function pilihanBatch(idTerpilih) {
  return getState().batches
    .map((b) => `<option value="${b.id}" ${b.id === idTerpilih ? 'selected' : ''}>${esc(b.nama)}</option>`)
    .join('');
}

function kartuKosong(pesan) {
  return `<div class="kartu kosong"><p>${pesan}</p>
    <button class="tombol utama" data-aksi="ke-kandang">Tambah Kandang / Batch</button></div>`;
}

/* ---------- Beranda ---------- */

function renderBeranda() {
  const s = getState();
  if (!s.batches.length) {
    return `<section class="halaman">
      <div class="kartu sambutan">
        <h2>Selamat datang 👋</h2>
        <p>Aplikasi ini membantu memantau pakan harian, umur, jadwal vaksin, dan produksi telur ayam kampung petelur, KUB-2, dan Elba. Semua data tersimpan di HP Anda dan tetap bisa dibuka tanpa internet.</p>
        <button class="tombol utama" data-aksi="ke-kandang">Mulai: Tambah Batch Ayam</button>
      </div>
      ${renderTipsPemula()}
    </section>`;
  }

  const hariIni = isoHariIni();
  let totalAyam = 0, totalGram = 0;
  s.batches.forEach((b) => {
    totalAyam += b.jumlah || 0;
    totalGram += kebutuhanPakanBatch(b).totalGram;
  });
  const telurHariIni = s.catatan.filter((c) => c.tanggal === hariIni).reduce((t, c) => t + (c.telur || 0), 0);
  const ayamProduksi = s.batches
    .filter((b) => umurHari(b) >= (BREEDS[b.jenis] || BREEDS.kampung).mulaiBertelurHari)
    .reduce((t, b) => t + (b.jumlah || 0), 0);
  const hdp = ayamProduksi ? (telurHariIni / ayamProduksi) * 100 : 0;
  const biayaPakan = (totalGram / 1000) * (s.pengaturan.hargaPakan || 0);

  const tugas = [];
  s.batches.forEach((b) => {
    jadwalVaksinBatch(b, 14).forEach((v) => {
      if (v.status === 'terlambat' || v.status === 'hari-ini' || (v.status === 'akan-datang' && v.sisaHari <= 7)) {
        tugas.push({ batch: b, v });
      }
    });
  });
  tugas.sort((a, b) => a.v.sisaHari - b.v.sisaHari);

  return `<section class="halaman">
    <div class="grid-statistik">
      <div class="stat"><span class="label">Total ayam</span><strong>${angka(totalAyam, 0)}</strong><small>ekor · ${s.batches.length} batch</small></div>
      <div class="stat"><span class="label">Pakan hari ini</span><strong>${angka(totalGram / 1000)} kg</strong><small>≈ ${rupiah(biayaPakan)}</small></div>
      <div class="stat"><span class="label">Telur hari ini</span><strong>${angka(telurHariIni, 0)}</strong><small>HDP ${angka(hdp)}%</small></div>
      <div class="stat"><span class="label">Ayam produktif</span><strong>${angka(ayamProduksi, 0)}</strong><small>sudah umur bertelur</small></div>
    </div>

    <div class="kartu">
      <h3>Tugas kesehatan 7 hari ke depan</h3>
      ${tugas.length ? `<ul class="daftar">${tugas.slice(0, 8).map(({ batch, v }) => `
        <li class="baris">
          <div>
            <strong>${esc(v.nama)}</strong>
            <small>${esc(batch.nama)} · umur ${v.hari} hari · ${formatTanggal(v.tanggal)}</small>
          </div>
          <span class="tanda ${v.status}">${labelStatus(v)}</span>
        </li>`).join('')}</ul>`
      : '<p class="samar">Tidak ada jadwal vaksin dalam waktu dekat.</p>'}
    </div>

    <div class="kartu">
      <h3>Catat telur cepat</h3>
      ${formCatatan(hariIni)}
    </div>

    ${renderTipsPemula()}

    <div class="kartu">
      <h3>Pengaturan & cadangan data</h3>
      <div class="form-baris">
        <label>Harga pakan (Rp/kg)
          <input type="number" id="harga-pakan" value="${s.pengaturan.hargaPakan}" min="0" />
        </label>
        <label>Harga telur (Rp/butir)
          <input type="number" id="harga-telur" value="${s.pengaturan.hargaTelur}" min="0" />
        </label>
      </div>
      <button class="tombol" data-aksi="simpan-pengaturan">Simpan harga</button>
      <div class="tombol-grup">
        <button class="tombol" data-aksi="ekspor">Unduh cadangan (.json)</button>
        <button class="tombol" data-aksi="impor">Pulihkan dari file</button>
        <input type="file" id="file-impor" accept="application/json" hidden />
      </div>
      <p class="samar kecil">Data hanya tersimpan di perangkat ini. Unduh cadangan secara berkala agar aman bila HP diganti atau data browser dihapus.</p>
    </div>
  </section>`;
}

function renderTipsPemula() {
  return `<div class="kartu">
    <h3>Tips untuk pemula</h3>
    <ul class="poin">${TIPS_PEMULA.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
  </div>`;
}

function labelStatus(v) {
  if (v.status === 'selesai') return 'Selesai';
  if (v.status === 'terlambat') return 'Terlambat ' + Math.abs(v.sisaHari) + " hr";
  if (v.status === 'hari-ini') return 'Hari ini';
  return v.sisaHari + ' hari lagi';
}

/* ---------- Kandang ---------- */

function renderKandang() {
  const s = getState();
  const daftar = s.batches.map((b) => {
    const p = kebutuhanPakanBatch(b);
    const breed = BREEDS[b.jenis] || BREEDS.kampung;
    const mulai = tambahHari(b.tglMenetas, breed.mulaiBertelurHari);
    const sudahBertelur = p.umurHari >= breed.mulaiBertelurHari;
    return `<div class="kartu batch">
      <div class="batch-judul">
        <div>
          <h3>${esc(b.nama)}</h3>
          <small>${esc(breed.nama)}</small>
        </div>
        <div class="tombol-grup rapat">
          <button class="tombol kecil" data-aksi="edit-batch" data-id="${b.id}">Ubah</button>
          <button class="tombol kecil bahaya" data-aksi="hapus-batch" data-id="${b.id}">Hapus</button>
        </div>
      </div>
      <div class="grid-detail">
        <div><span>Jumlah</span><strong>${angka(b.jumlah, 0)} ekor</strong></div>
        <div><span>Umur</span><strong>${umurTeks(p.umurHari)}</strong></div>
        <div><span>Fase</span><strong>${esc(p.fase)}</strong></div>
        <div><span>Pakan/ekor</span><strong>${p.gramPerEkor} g/hari</strong></div>
        <div><span>Pakan batch</span><strong>${angka(p.totalKg, 2)} kg/hari</strong></div>
        <div><span>${sudahBertelur ? 'Mulai bertelur' : 'Perkiraan bertelur'}</span><strong>${formatTanggal(mulai)}</strong></div>
      </div>
      ${b.catatan ? `<p class="samar kecil">${esc(b.catatan)}</p>` : ''}
    </div>`;
  }).join('');

  return `<section class="halaman">
    <div class="kartu">
      <h3>${batchDiedit ? 'Ubah batch' : 'Tambah batch ayam'}</h3>
      ${formBatch(batchDiedit ? cariBatch(batchDiedit) : null)}
    </div>
    ${daftar || '<div class="kartu kosong"><p>Belum ada batch. Tambahkan batch pertama Anda di atas.</p></div>'}
  </section>`;
}

function formBatch(batch) {
  const b = batch || { nama: '', jenis: 'kampung', jumlah: '', tglMenetas: isoHariIni(), catatan: '' };
  return `<form id="form-batch" class="form">
    <label>Nama batch / kandang
      <input name="nama" value="${esc(b.nama)}" placeholder="Contoh: Kandang A" required />
    </label>
    <label>Jenis ayam
      <select name="jenis">
        ${Object.values(BREEDS).map((x) => `<option value="${x.id}" ${x.id === b.jenis ? 'selected' : ''}>${esc(x.nama)}</option>`).join('')}
      </select>
    </label>
    <div class="form-baris">
      <label>Jumlah ayam (ekor)
        <input name="jumlah" type="number" min="1" value="${b.jumlah}" required />
      </label>
      <label>Tanggal menetas / DOC masuk
        <input name="tglMenetas" type="date" value="${b.tglMenetas}" max="${isoHariIni()}" required />
      </label>
    </div>
    <label>Catatan (opsional)
      <input name="catatan" value="${esc(b.catatan || '')}" placeholder="Misal: DOC dari peternak X" />
    </label>
    <div class="tombol-grup">
      <button class="tombol utama" type="submit">${batch ? 'Simpan perubahan' : 'Tambah batch'}</button>
      ${batch ? '<button class="tombol" type="button" data-aksi="batal-edit">Batal</button>' : ''}
    </div>
  </form>`;
}

/* ---------- Pakan ---------- */

function renderPakan() {
  const s = getState();
  if (!s.batches.length) return `<section class="halaman">${kartuKosong('Tambah batch dulu untuk menghitung kebutuhan pakan.')}</section>`;

  let totalHarian = 0;
  const baris = s.batches.map((b) => {
    const p = kebutuhanPakanBatch(b);
    totalHarian += p.totalKg;
    return `<tr>
      <td><strong>${esc(b.nama)}</strong><br /><small>${umurTeks(p.umurHari)} · ${esc(p.fase)}</small></td>
      <td>${angka(b.jumlah, 0)}</td>
      <td>${p.gramPerEkor} g</td>
      <td>${angka(p.totalKg, 2)} kg</td>
    </tr>`;
  }).join('');

  const harga = s.pengaturan.hargaPakan || 0;
  const id = batchAktifId();
  const batch = cariBatch(id);
  const breed = BREEDS[batch.jenis] || BREEDS.kampung;
  const umur = umurHari(batch);

  return `<section class="halaman">
    <div class="kartu">
      <h3>Kebutuhan pakan hari ini</h3>
      <table class="tabel">
        <thead><tr><th>Batch</th><th>Ekor</th><th>/ekor</th><th>Total</th></tr></thead>
        <tbody>${baris}</tbody>
        <tfoot><tr><th colspan="3">Total semua batch</th><th>${angka(totalHarian, 2)} kg</th></tr></tfoot>
      </table>
      <div class="grid-statistik kecil-3">
        <div class="stat"><span class="label">Per minggu</span><strong>${angka(totalHarian * 7, 1)} kg</strong><small>${rupiah(totalHarian * 7 * harga)}</small></div>
        <div class="stat"><span class="label">Per bulan</span><strong>${angka(totalHarian * 30, 1)} kg</strong><small>${rupiah(totalHarian * 30 * harga)}</small></div>
        <div class="stat"><span class="label">Karung 50 kg</span><strong>${angka((totalHarian * 30) / 50, 1)}</strong><small>per bulan</small></div>
      </div>
    </div>

    <div class="kartu">
      <h3>Tabel standar pakan</h3>
      <label>Pilih batch
        <select data-aksi="pilih-batch">${pilihanBatch(id)}</select>
      </label>
      <p class="samar kecil">${esc(breed.nama)} · umur sekarang ${umurTeks(umur)}</p>
      <table class="tabel">
        <thead><tr><th>Umur</th><th>Fase</th><th>Protein</th><th>g/ekor/hari</th><th>Total batch</th></tr></thead>
        <tbody>
          ${breed.pakan.map((p, i) => {
            const dari = i === 0 ? 0 : breed.pakan[i - 1].sampaiMinggu;
            const aktif = umur / 7 > dari && umur / 7 <= p.sampaiMinggu;
            const rentang = p.sampaiMinggu > 900 ? '> ' + dari + ' mg' : dari + '-' + p.sampaiMinggu + ' mg';
            return `<tr class="${aktif ? 'sorot' : ''}">
              <td>${rentang}</td><td>${esc(p.fase)}</td><td>${esc(p.protein)}</td>
              <td>${p.gram} g</td><td>${angka((p.gram * batch.jumlah) / 1000, 2)} kg</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <p class="samar kecil">Baris bertanda warna adalah fase pakan batch saat ini. Berikan pakan 2 kali sehari (pagi 40%, sore 60%) pada masa produksi.</p>
    </div>
  </section>`;
}

/* ---------- Vaksin ---------- */

function renderVaksin() {
  const s = getState();
  if (!s.batches.length) return `<section class="halaman">${kartuKosong('Tambah batch dulu untuk melihat jadwal vaksin.')}</section>`;
  const id = batchAktifId();
  const batch = cariBatch(id);
  const jadwal = jadwalVaksinBatch(batch, 120);
  const umur = umurHari(batch);

  return `<section class="halaman">
    <div class="kartu">
      <h3>Jadwal vaksin & kesehatan</h3>
      <label>Pilih batch
        <select data-aksi="pilih-batch">${pilihanBatch(id)}</select>
      </label>
      <p class="samar kecil">${esc(batch.nama)} · umur ${umurTeks(umur)} · centang bila sudah dikerjakan.</p>
      <ul class="daftar vaksin">
        ${jadwal.map((v) => `<li class="baris ${v.status}">
          <label class="centang">
            <input type="checkbox" data-aksi="toggle-vaksin" data-kunci="${v.kunci}" ${v.selesai ? 'checked' : ''} />
            <span>
              <strong>${esc(v.nama)}</strong>
              <small>Umur ${v.hari} hari · ${formatTanggal(v.tanggal)} · ${esc(v.cara)}</small>
              <small class="samar">${esc(v.catatan)}</small>
            </span>
          </label>
          <span class="tanda ${v.status}">${labelStatus(v)}</span>
        </li>`).join('')}
      </ul>
      <p class="samar kecil">Vaksin hanya diberikan pada ayam sehat. Sisa vaksin yang sudah dilarutkan jangan dipakai lagi keesokan hari.</p>
    </div>
  </section>`;
}

/* ---------- Telur ---------- */

function formCatatan(tanggal) {
  const id = batchAktifId();
  if (!id) return '<p class="samar">Belum ada batch.</p>';
  const s = getState();
  const adaCatatan = s.catatan.find((c) => c.batchId === id && c.tanggal === tanggal) || {};
  return `<form id="form-catatan" class="form">
    <div class="form-baris">
      <label>Tanggal<input name="tanggal" type="date" value="${tanggal}" max="${isoHariIni()}" required /></label>
      <label>Batch<select name="batchId">${pilihanBatch(id)}</select></label>
    </div>
    <div class="form-baris">
      <label>Telur (butir)<input name="telur" type="number" min="0" value="${adaCatatan.telur != null ? adaCatatan.telur : ''}" required /></label>
      <label>Ayam mati<input name="mati" type="number" min="0" value="${adaCatatan.mati != null ? adaCatatan.mati : 0}" /></label>
      <label>Pakan terpakai (kg)<input name="pakanKg" type="number" step="0.1" min="0" value="${adaCatatan.pakanKg != null ? adaCatatan.pakanKg : ''}" /></label>
    </div>
    <button class="tombol utama" type="submit">Simpan catatan harian</button>
  </form>`;
}

function renderTelur() {
  const s = getState();
  if (!s.batches.length) return `<section class="halaman">${kartuKosong('Tambah batch dulu untuk mencatat telur.')}</section>`;
  const id = batchAktifId();
  const batch = cariBatch(id);
  const catatan = s.catatan.filter((c) => c.batchId === id);
  const ring = ringkasanTelur(catatan, batch.jumlah);
  const breed = BREEDS[batch.jenis] || BREEDS.kampung;
  const maks = Math.max(1, ...catatan.slice(0, 14).map((c) => c.telur || 0));
  const grafik = catatan.slice(0, 14).reverse();
  const pendapatan = ring.total * (s.pengaturan.hargaTelur || 0);

  return `<section class="halaman">
    <div class="kartu">
      <h3>Catat produksi harian</h3>
      ${formCatatan(isoHariIni())}
    </div>

    <div class="kartu">
      <label>Lihat batch
        <select data-aksi="pilih-batch">${pilihanBatch(id)}</select>
      </label>
      <div class="grid-statistik kecil-3">
        <div class="stat"><span class="label">HDP terakhir</span><strong>${angka(ring.hdpTerakhir)}%</strong><small>target ${breed.puncakHdp}%</small></div>
        <div class="stat"><span class="label">Rata-rata 7 hari</span><strong>${angka(ring.rata7)}</strong><small>butir/hari (HDP ${angka(ring.hdpRata7)}%)</small></div>
        <div class="stat"><span class="label">Total tercatat</span><strong>${angka(ring.total, 0)}</strong><small>≈ ${rupiah(pendapatan)}</small></div>
      </div>
      ${grafik.length ? `<div class="grafik">${grafik.map((c) => `
        <div class="bar-wrap" title="${formatTanggal(c.tanggal)}: ${c.telur} butir">
          <div class="bar" style="height:${Math.round(((c.telur || 0) / maks) * 100)}%"></div>
          <span>${formatTanggal(c.tanggal).split(' ')[0]}</span>
        </div>`).join('')}</div>` : '<p class="samar">Belum ada catatan untuk batch ini.</p>'}
    </div>

    <div class="kartu">
      <h3>Riwayat catatan</h3>
      ${catatan.length ? `<table class="tabel">
        <thead><tr><th>Tanggal</th><th>Telur</th><th>HDP</th><th>Mati</th><th>Pakan</th><th></th></tr></thead>
        <tbody>${catatan.slice(0, 60).map((c) => `<tr>
          <td>${formatTanggal(c.tanggal)}</td>
          <td>${angka(c.telur || 0, 0)}</td>
          <td>${batch.jumlah ? angka(((c.telur || 0) / batch.jumlah) * 100) + '%' : '-'}</td>
          <td>${angka(c.mati || 0, 0)}</td>
          <td>${c.pakanKg ? angka(c.pakanKg, 1) + ' kg' : '-'}</td>
          <td><button class="tombol kecil bahaya" data-aksi="hapus-catatan" data-id="${c.id}">Hapus</button></td>
        </tr>`).join('')}</tbody>
      </table>` : '<p class="samar">Belum ada riwayat.</p>'}
    </div>
  </section>`;
}

/* ---------- Panduan ---------- */

function renderPanduan() {
  const s = getState();
  const id = batchAktifId();
  const batch = id ? cariBatch(id) : null;
  const umur = batch ? umurHari(batch) : null;
  const fase = batch ? fasePanduan(umur) : null;

  return `<section class="halaman">
    ${batch ? `<div class="kartu sorot-kartu">
      <label>Panduan untuk batch
        <select data-aksi="pilih-batch">${pilihanBatch(id)}</select>
      </label>
      <h3>${esc(fase.nama)}</h3>
      <p class="samar kecil">${esc(batch.nama)} · umur ${umurTeks(umur)}</p>
      <ul class="poin">${fase.poin.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    </div>` : ''}

    <div class="kartu">
      <h3>Semua fase pemeliharaan</h3>
      ${PANDUAN_FASE.map((f) => `<details><summary>${esc(f.nama)}</summary>
        <ul class="poin">${f.poin.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></details>`).join('')}
    </div>

    <div class="kartu">
      <h3>Perbandingan jenis ayam</h3>
      <table class="tabel">
        <thead><tr><th>Jenis</th><th>Mulai bertelur</th><th>Puncak HDP</th><th>Pakan layer</th></tr></thead>
        <tbody>${Object.values(BREEDS).map((b) => `<tr>
          <td>${esc(b.nama)}</td>
          <td>± ${Math.round(b.mulaiBertelurHari / 7)} minggu</td>
          <td>${b.puncakHdp}%</td>
          <td>${b.pakan[b.pakan.length - 1].gram} g/ekor</td>
        </tr>`).join('')}</tbody>
      </table>
      <p class="samar kecil">HDP (Hen Day Production) = jumlah telur ÷ jumlah ayam × 100%. Contoh: 100 ekor menghasilkan 45 telur = HDP 45%.</p>
    </div>

    ${renderTipsPemula()}

    <div class="kartu">
      <h3>Tanda ayam bermasalah</h3>
      <ul class="poin">
        <li>Ngorok / bersin dan hidung berlendir: kemungkinan CRD atau snot, pisahkan dan beri antibiotik sesuai anjuran.</li>
        <li>Kotoran hijau atau putih encer disertai kematian mendadak: waspada ND (tetelo), hubungi mantri ternak.</li>
        <li>Kotoran berdarah pada ayam muda: koksidiosis, beri antikoksi dan ganti litter basah.</li>
        <li>Telur kerabang tipis atau lembek: kekurangan kalsium, tambahkan grit/kapur atau cangkang halus.</li>
        <li>Ayam mematuk telur: telur terlalu lama di sarang, kurang protein, atau kandang terlalu terang.</li>
      </ul>
    </div>
  </section>`;
}

/* ---------- Router & event ---------- */

const HALAMAN = {
  beranda: renderBeranda,
  kandang: renderKandang,
  pakan: renderPakan,
  vaksin: renderVaksin,
  telur: renderTelur,
  panduan: renderPanduan
};

function render() {
  konten.innerHTML = HALAMAN[tabAktif]();
  document.querySelectorAll('#tab-bar button').forEach((b) => {
    b.classList.toggle('aktif', b.dataset.tab === tabAktif);
  });
  konten.scrollTop = 0;
  window.scrollTo(0, 0);
}

document.getElementById('tab-bar').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  tabAktif = btn.dataset.tab;
  render();
});

konten.addEventListener('click', (e) => {
  const t = e.target.closest('[data-aksi]');
  if (!t) return;
  const aksi = t.dataset.aksi;

  if (aksi === 'ke-kandang') { tabAktif = 'kandang'; render(); }
  if (aksi === 'edit-batch') { batchDiedit = t.dataset.id; render(); }
  if (aksi === 'batal-edit') { batchDiedit = null; render(); }
  if (aksi === 'hapus-batch') {
    const b = cariBatch(t.dataset.id);
    if (b && confirm('Hapus batch "' + b.nama + '" beserta catatan hariannya?')) hapusBatch(b.id);
  }
  if (aksi === 'hapus-catatan') {
    if (confirm('Hapus catatan ini?')) hapusCatatan(t.dataset.id);
  }
  if (aksi === 'simpan-pengaturan') {
    simpanPengaturan({
      hargaPakan: Number(document.getElementById('harga-pakan').value) || 0,
      hargaTelur: Number(document.getElementById('harga-telur').value) || 0
    });
  }
  if (aksi === 'ekspor') unduhCadangan();
  if (aksi === 'impor') document.getElementById('file-impor').click();
});

konten.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.aksi === 'pilih-batch') { batchTerpilih = t.value; render(); return; }
  if (t.dataset.aksi === 'toggle-vaksin') {
    setVaksinSelesai(batchAktifId(), t.dataset.kunci, t.checked ? isoHariIni() : null);
    return;
  }
  if (t.id === 'file-impor' && t.files[0]) {
    const pembaca = new FileReader();
    pembaca.onload = () => {
      try {
        imporJson(pembaca.result);
        alert('Data cadangan berhasil dipulihkan.');
      } catch (err) {
        alert('Gagal memulihkan: ' + err.message);
      }
    };
    pembaca.readAsText(t.files[0]);
  }
});

konten.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());

  if (form.id === 'form-batch') {
    const batch = {
      nama: data.nama.trim(),
      jenis: data.jenis,
      jumlah: Number(data.jumlah),
      tglMenetas: data.tglMenetas,
      catatan: data.catatan.trim()
    };
    if (batchDiedit) { ubahBatch(batchDiedit, batch); batchDiedit = null; }
    else { tambahBatch(batch); }
  }

  if (form.id === 'form-catatan') {
    simpanCatatan({
      batchId: data.batchId,
      tanggal: data.tanggal,
      telur: Number(data.telur) || 0,
      mati: Number(data.mati) || 0,
      pakanKg: Number(data.pakanKg) || 0
    });
    batchTerpilih = data.batchId;
  }
});

function unduhCadangan() {
  const blob = new Blob([eksporJson()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cadangan-ternak-ayam-' + isoHariIni() + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function perbaruiStatusJaringan() {
  const s = document.getElementById('status-jaringan');
  s.textContent = navigator.onLine ? 'online' : 'offline';
  s.className = 'lonceng ' + (navigator.onLine ? 'online' : 'offline');
}

window.addEventListener('online', perbaruiStatusJaringan);
window.addEventListener('offline', perbaruiStatusJaringan);

onChange(render);
muat();
perbaruiStatusJaringan();
render();
