import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'ВК Авогадро',
    short_name: 'Авогадро',
    description: 'Офіційний сайт волейбольного клубу «Авогадро»: розклад, результати, склад',
    lang: 'uk',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#050d22',
    theme_color: '#050d22',
    categories: ['sports'],
    icons: [
      { src: '/images/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/images/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'Матчі', url: '/#matches' },
      { name: 'Календар матчів', url: '/calendar' },
    ],
  }
}
