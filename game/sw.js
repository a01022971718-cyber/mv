// 离线缓存：第一次联网打开后，游戏本体、发音包、识别程序都存进手机；之后断网也能打开。
// 识别模型（.tar.gz）由识别库自己存进 IndexedDB，这里不经手。
const V = 'doudou-v2';
const CORE = ['./index.html', './voice.js', './vendor/vosk.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const BIG = /\/(voice\.js|vendor\/vosk\.js|icon-\d+\.png)$/;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const keep = (req, res) => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(V).then(c => c.put(req, cp)); } return res; };
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.endsWith('.tar.gz')) return;
  const same = url.origin === location.origin, font = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !font) return;
  if ((same && BIG.test(url.pathname)) || url.hostname === 'fonts.gstatic.com') {
    // 大文件和字体：先用缓存，省流量
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => keep(req, res))));
    return;
  }
  // 页面本身：先联网拿最新版本，断网时用缓存
  e.respondWith(fetch(req).then(res => keep(req, res)).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
