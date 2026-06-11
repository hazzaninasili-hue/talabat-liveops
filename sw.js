const CACHE_VERSION = 'talabat-v1781167921';
const CACHE_NAME = CACHE_VERSION;
const PRECACHE = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // NEVER intercept: Supabase API, fonts, CDN scripts
  if (url.hostname.includes('supabase.co') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com') ||
      url.hostname.includes('cdn.jsdelivr.net') ||
      url.hostname.includes('flaticon.com') ||
      url.hostname.includes('make.com') ||
      url.hostname.includes('google.com')) {
    return; // Let browser handle normally
  }

  // Main HTML pages — network first
  if (e.request.mode === 'navigate' ||
      url.pathname.endsWith('index.html') ||
      url.pathname.endsWith('app.html') ||
      url.pathname === '/talabat-liveops/' ||
      url.pathname === '/talabat-liveops') {
    e.respondWith(
      fetch(e.request).then(res => {
        caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Everything else — cache first
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
        }
        return res;
      })
    ).catch(() => new Response('', {status: 408}))
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
