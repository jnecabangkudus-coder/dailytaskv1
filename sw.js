// OmniTask Pro — Service Worker v1
const CACHE_NAME = 'omnitask-v1';
const ASSETS = [
  '/dailytaskv1/',
  '/dailytaskv1/index.html',
  '/dailytaskv1/manifest.json'
];

// Install: cache asset dasar
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate: hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first untuk API, cache-first untuk asset
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Jangan cache Firebase & API Gemini
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic')) {
    return; // biarkan lewat
  }
  
  // Hanya handle GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        // Cache response baru (kalau sukses)
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached); // offline → pakai cache
      
      return cached || fetchPromise;
    })
  );
});
