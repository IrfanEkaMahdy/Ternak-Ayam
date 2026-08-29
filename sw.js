/* Service worker: menyimpan aset aplikasi agar bisa dibuka tanpa internet. */

const CACHE = 'ternak-ayam-v1';
const ASET = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/style.css',
  './assets/js/standards.js',
  './assets/js/storage.js',
  './assets/js/hitung.js',
  './assets/js/ui.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASET)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((kunci) => Promise.all(kunci.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((tersimpan) => {
      const jaringan = fetch(e.request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const salinan = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, salinan));
          }
          return res;
        })
        .catch(() => tersimpan || caches.match('./index.html'));
      return tersimpan || jaringan;
    })
  );
});
