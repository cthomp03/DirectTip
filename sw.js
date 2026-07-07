// DirectTip Service Worker v3.0
// v2: fixed offline fallback path, Firebase-safe fetch strategy,
//     caches the Firebase SDK modules for offline boot.
// v3: network-first for page navigations so app updates arrive on next
//     launch automatically (no more cache-version bumps for HTML changes)

const CACHE = 'directtip-v3';
const ASSETS = [
  '/DirectTip/index.html',
  '/DirectTip/manifest.json',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap'
];

// Hosts whose GET responses are safe to cache (static content)
const CACHEABLE_HOSTS = [
  self.location.hostname,        // our own origin (GitHub Pages)
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.gstatic.com'              // Firebase SDK modules (static, versioned URLs)
];

// Hosts that must NEVER be intercepted — live API traffic.
// Caching these breaks Firestore listeners and Auth token refresh.
const BYPASS_HOSTS = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebaseinstallations.googleapis.com'
];

// Install — cache all core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate — clean up old caches (removes directtip-v1)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for static assets, pass-through for API traffic
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Let Firebase API traffic go straight to the network, untouched
  if (BYPASS_HOSTS.includes(url.hostname)) return;

  // Only cache known-static hosts; anything else passes through
  if (!CACHEABLE_HOSTS.includes(url.hostname)) return;

  // QR deep links arrive as index.html?tip=... — ignore the query when
  // matching so the cached shell still serves offline
  const matchOpts = { ignoreSearch: e.request.mode === 'navigate' };

  // NETWORK-FIRST for page loads: always try to fetch the latest
  // index.html so deploys appear on next launch; fall back to cache offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match(e.request, matchOpts)
          .then(c => c || caches.match('/DirectTip/index.html')))
    );
    return;
  }

  // CACHE-FIRST for everything else (fonts, SDK modules, manifest)
  e.respondWith(
    caches.match(e.request, matchOpts).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('/DirectTip/index.html'));
    })
  );
});
