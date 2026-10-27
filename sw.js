const CACHE_NAME = 'daily-protocol-offline-v2';
const OFFLINE_ASSETS = [
  './',
  './index.html',
  './icon.png',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];

// 1. Saat pertama kali dibuka: Simpan aplikasi & font ke memori internal iPhone
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_ASSETS).catch(() => {
        // Tetap simpan index.html meskipun icon.png belum diunggah
        return cache.addAll(['./', './index.html']);
      });
    })
  );
  self.skipWaiting();
});

// 2. Bersihkan cache versi lama jika ada pembaruan
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// 3. Strategi Network-First with Cache Fallback:
// - Saat ada internet: Ambil versi terbaru dari GitHub & perbarui simpanan offline.
// - Saat OFFLINE / Mode Pesawat: Langsung sajikan dari memori iPhone secara instan!
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});
