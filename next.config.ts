import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs/config'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Шрифт і емблема для картинок поширення матчів (читаються з диска на сервері)
  outputFileTracingIncludes: {
    '/matches/[id]/opengraph-image': ['./assets/og/**'],
    '/en/matches/[id]/opengraph-image': ['./assets/og/**'],
  },
  images: {
    // Фото вже стискаються під час завантаження, тож оптимізатор Vercel не потрібен
    // (і не витрачає безкоштовний ліміт трансформацій).
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

// Sentry: сповіщення про помилки. Працює, лише якщо задано SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN.
// Вихідні карти коду надсилаються тільки з SENTRY_AUTH_TOKEN (необов'язково).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  // Події йдуть через сам сайт, щоб їх не блокували блокувальники реклами
  tunnelRoute: '/monitoring',
})
