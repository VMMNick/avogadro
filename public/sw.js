/* Офлайн-режим сайту ВК «Авогадро».
 * Сторінки: спершу мережа, без мережі — остання збережена копія (розклад видно й офлайн).
 * Статика (скрипти, стилі, шрифти, зображення): спершу кеш.
 * Адмінка, API, календарні файли й аналітика не кешуються ніколи. */
const VERSION = 'v1'
const PAGES = `avogadro-pages-${VERSION}`
const ASSETS = `avogadro-assets-${VERSION}`
const START_PAGES = ['/', '/en']
const SKIP = [/^\/admin/, /^\/api\//, /^\/monitoring/, /^\/_vercel/, /\.ics$/, /\/poster$/]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) =>
        Promise.all(
          START_PAGES.map((url) => cache.add(new Request(url, { cache: 'no-cache' })).catch(() => undefined)),
        ),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const isAsset = (url) =>
  url.pathname.startsWith('/_next/static/') ||
  url.pathname.startsWith('/images/') ||
  /\.(?:woff2?|png|webp|svg|jpg|jpeg|ico)$/.test(url.pathname)

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (SKIP.some((re) => re.test(url.pathname))) return

  if (request.mode === 'navigate') {
    event.respondWith(
      // no-cache: сторінку завжди звіряємо із сервером (інакше браузер може віддати застарілу копію з кешу HTTP)
      fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then((response) => {
          if (response.ok && !response.redirected) {
            const copy = response.clone()
            caches.open(PAGES).then((cache) => cache.put(url.pathname, copy))
          }
          return response
        })
        .catch(async () => {
          const cache = await caches.open(PAGES)
          const fallback = url.pathname.startsWith('/en') ? '/en' : '/'
          return (await cache.match(url.pathname)) || (await cache.match(fallback)) || Response.error()
        }),
    )
    return
  }

  if (isAsset(url)) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const cached = await cache.match(request)
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      }),
    )
  }
})
