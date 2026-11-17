/* Talk & Grow service worker: keeps the app's own files on the device so it opens without internet.
   Change VERSION after uploading new files, so phones pick up the update. */
var VERSION = 'talk-and-grow-v1.3.0';
var FILES = ['./', 'index.html', 'styles.css', 'config.js', 'content.js', 'content-school.js', 'core.js', 'screens.js', 'kids.js', 'reports.js', 'study.js', 'menu.js', 'videos.js', 'demo.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'fonts/nunito.woff2', 'fonts/fredoka-600.woff2'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('talk-and-grow-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (e) { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // the API (Apps Script) always goes to the network
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    var net = fetch(e.request).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, copy); }); }
      return res;
    }).catch(function () { return hit; });
    return hit || net;
  }));
});
