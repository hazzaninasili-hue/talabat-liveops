// Talabat Operations - Service Worker
// Cache version tied to build — change this = old cache deleted automatically
const CACHE_VERSION = 'talabat-v1781089238';
const CACHE_NAME = CACHE_VERSION;

// Files to cache for offline use
const PRECACHE = [
  './',
  './index.html'
];

// ── Install: cache core files ──
self.addEventListener('install', e => {
  console.log('[SW] Installing', CACHE_NAME);
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE);
    }).then(() => {
      // Take over immediately — don't wait for old SW to die
      return self.skipWaiting();
    })
  );
});

// ── Activate: delete ALL old caches ──
self.addEventListener('activate', e => {
  console.log('[SW] Activating', CACHE_NAME);
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for HTML, cache-first for assets ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go network-first for the main HTML page
  if (e.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/talabat-liveops/' || url.pathname === '/talabat-liveops') {
    e.respondWith(
      fetch(e.request).then(res => {
        // Cache the fresh version
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => {
        // Offline fallback
        return caches.match('./index.html');
      })
    );
    return;
  }

  // For everything else: cache-first (fonts, icons, supabase JS)
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      });
    }).catch(() => caches.match('./index.html'))
  );
});

// ── Message: handle SKIP_WAITING from app ──
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting triggered');
    self.skipWaiting();
  }
});
