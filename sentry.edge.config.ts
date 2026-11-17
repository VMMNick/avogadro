import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  // Лише помилки, без збору продуктивності — вкладаємось у безкоштовний ліміт
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
})
