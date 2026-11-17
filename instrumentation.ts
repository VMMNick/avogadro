import * as Sentry from '@sentry/nextjs'

// Сповіщення про помилки на сервері (Sentry). Без SENTRY_DSN нічого не надсилається.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./sentry.server.config')
  if (process.env.NEXT_RUNTIME === 'edge') await import('./sentry.edge.config')
}

export const onRequestError = Sentry.captureRequestError
