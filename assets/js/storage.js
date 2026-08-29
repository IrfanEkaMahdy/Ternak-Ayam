/* Penyimpanan lokal (offline-first). Semua data disimpan di localStorage perangkat. */

const STORAGE_KEY = 'ternak-ayam-v1';

const defaultState = () => ({
  versi: 1,
  batches: [],
  catatan: [],
  pengaturan: { hargaPakan: 8000, hargaTelur: 2500 }
});

let state = defaultState();
const listeners = [];

function muat() {
  try {
    const mentah = localStorage.getItem(STORAGE_KEY);
    if (mentah) {
      const data = JSON.parse(mentah);
      state = Object.assign(defaultState(), data);
      state.pengaturan = Object.assign(defaultState().pengaturan, data.pengaturan || {});
    }
  } catch (e) {
    console.error('Gagal membaca data tersimpan, memakai data kosong.', e);
    state = defaultState();
  }
  return state;
}

function simpan() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    alert('Penyimpanan perangkat penuh atau diblokir. Data terakhir mungkin tidak tersimpan.');
  }
  listeners.forEach((fn) => fn(state));
}

function onChange(fn) {
  listeners.push(fn);
}

function getState() {
  return state;
}

function idBaru() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function tambahBatch(batch) {
  state.batches.push(Object.assign({ id: idBaru(), vaksinSelesai: {} }, batch));
  simpan();
}

function ubahBatch(id, perubahan) {
  const b = state.batches.find((x) => x.id === id);
  if (!b) return;
  Object.assign(b, perubahan);
  simpan();
}

function hapusBatch(id) {
  state.batches = state.batches.filter((b) => b.id !== id);
  state.catatan = state.catatan.filter((c) => c.batchId !== id);
  simpan();
}

function setVaksinSelesai(batchId, kunci, tanggal) {
  const b = state.batches.find((x) => x.id === batchId);
  if (!b) return;
  if (!b.vaksinSelesai) b.vaksinSelesai = {};
  if (tanggal) b.vaksinSelesai[kunci] = tanggal;
  else delete b.vaksinSelesai[kunci];
  simpan();
}

function simpanCatatan(catatan) {
  const idx = state.catatan.findIndex(
    (c) => c.batchId === catatan.batchId && c.tanggal === catatan.tanggal
  );
  if (idx >= 0) state.catatan[idx] = Object.assign(state.catatan[idx], catatan);
  else state.catatan.push(Object.assign({ id: idBaru() }, catatan));
  state.catatan.sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
  simpan();
}

function hapusCatatan(id) {
  state.catatan = state.catatan.filter((c) => c.id !== id);
  simpan();
}

function simpanPengaturan(pengaturan) {
  Object.assign(state.pengaturan, pengaturan);
  simpan();
}

function eksporJson() {
  return JSON.stringify(state, null, 2);
}

function imporJson(teks) {
  const data = JSON.parse(teks);
  if (!data || !Array.isArray(data.batches)) throw new Error('Struktur file cadangan tidak dikenali.');
  state = Object.assign(defaultState(), data);
  simpan();
}
