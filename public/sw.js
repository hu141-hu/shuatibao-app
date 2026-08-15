/**
 * 刷题宝 Service Worker
 *
 * ⚠️ 发布新版本时，必须把 SW_VERSION 同步更新（与 public/version.json 的版本号一致），
 * 否则用户会一直停留在旧缓存页面。
 */
const SW_VERSION = 'v1.3.0';

const STATIC_CACHE = `shuati-static-${SW_VERSION}`;
const RUNTIME_CACHE = `shuati-runtime-${SW_VERSION}`;
const META_CACHE = 'shuati-meta-v1';

// 预缓存全部静态路由（应用外壳），保证离线可打开
const STATIC_ASSETS = [
  '/',
  '/quiz',
  '/study',
  '/community',
  '/profile',
  '/result',
  '/review',
  '/wrong-questions',
  '/confused',
  '/favorites',
  '/history',
  '/knowledge',
  '/search',
  '/account',
  '/account/manage',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => {
        // 某个资源失败不影响 SW 激活
        self.skipWaiting();
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE && key !== META_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 跨域请求（如 GitHub Raw / jsDelivr / jsdelivr CDN）：只走网络，不缓存，
  // 避免 version.json 或 OCR 资源被旧缓存卡住
  if (url.origin !== self.location.origin) return;

  // 版本检查文件：网络优先，失败时回退缓存
  if (url.pathname === '/version.json') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(META_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || Response.error())
        )
    );
    return;
  }

  // 页面导航（HTML）：网络优先，离线时回退到缓存的首页
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached || caches.match('/')
          )
        )
    );
    return;
  }

  // 静态资源（chunk / css / 图标 等）：stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
