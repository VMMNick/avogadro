// Помилки в браузері відвідувачів → Sentry. Бібліотека завантажується лише коли задано NEXT_PUBLIC_SENTRY_DSN,
// тож без налаштування сайт не завантажує зайвого коду.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
      tracesSampleRate: 0,
      // Не надсилаємо особистих даних: ні cookies (там сесія адміна), ні тіл форм (паролі)
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpBodies: [],
        httpHeaders: {
          request: { allow: ['user-agent', 'referer'] },
          response: false,
        },
      },
      // Помилки з розширень браузера нас не цікавлять
      denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i, /^safari-extension:\/\//i],
    })
  })
}
