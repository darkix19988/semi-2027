// Mode hors ligne : on sert toujours la version du réseau quand elle arrive vite,
// et la dernière version gardée en cache quand le réseau est absent ou trop lent (parc, sous-sol, mode avion).
const CACHE = 'semi27-v1';
const SHELL = ['./', 'apple-touch-icon.png', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const cached = () => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./') : undefined));
  const fresh = fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  });
  const slow = new Promise(resolve => setTimeout(resolve, 3000));
  e.respondWith(
    Promise.race([fresh, slow])
      .then(res => res || cached().then(c => c || fresh))
      .catch(() => cached().then(c => c || Response.error()))
  );
});
