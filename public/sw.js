/**
 * 刷题宝 Service Worker
 *
 * ⚠️ 发布新版本时，必须把 SW_VERSION 同步更新（与 public/version.json 的版本号一致），
 * 否则用户会一直停留在旧缓存页面。
 *
 * v1.4.3 起的修正：
 *   1. 路由带尾斜杠（/quiz/），与静态导出的 quiz/index.html 对齐；
 *      老版本缓存键是不带斜杠的 /quiz，存进去的很可能是回落后的首页 HTML。
 *   2. 导航请求只有「响应 URL 与请求一致」时才写缓存，
 *      防止服务器回落成 index.html 时把首页钉死在这个路径上。
 *   3. 静态资源同样校验状态码与响应 URL，避免把 404 / 错误页缓存住。
 */
const SW_VERSION = 'v1.4.3';

const STATIC_CACHE = `shuati-static-${SW_VERSION}`;
const RUNTIME_CACHE = `shuati-runtime-${SW_VERSION}`;
const META_CACHE = 'shuati-meta-v1';

// 预缓存应用外壳，保证断网也能打开各个页面
const STATIC_ASSETS = [
  '/',
  '/quiz/',
  '/study/',
  '/profile/',
  '/result/',
  '/review/',
  '/wrong-questions/',
  '/confused/',
  '/favorites/',
  '/history/',
  '/knowledge/',
  '/search/',
  '/account/',
  '/account/manage/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        // 逐个添加：某个路径失败不会让整批 install 失败
        Promise.all(
          STATIC_ASSETS.map((url) =>
            fetch(url, { cache: 'reload' })
              .then((res) => {
                if (res && res.ok) return cache.put(url, res);
                return undefined;
              })
              .catch(() => undefined)
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE && key !== META_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 跨域请求（GitHub Raw / jsDelivr / OCR 资源等）：只走网络，不缓存
  if (url.origin !== self.location.origin) return;

  // 版本检查文件：网络优先，失败回退缓存
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
        .catch(() => caches.match(request).then((cached) => cached || Response.error()))
    );
    return;
  }

  // 页面导航：网络优先，离线回退到该路径缓存，再回退到首页
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 关键：服务器若把该路径回落成 index.html，响应 URL 会对不上。
          // 这种情况绝不能写缓存，否则这个路径以后永远只显示首页。
          const sameUrl = !!response && response.url === request.url;
          if (response && response.status === 200 && sameUrl) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // 静态资源（chunk / css / 图标）：stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.url === request.url) {
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
