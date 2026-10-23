import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ВК Авогадро',
    short_name: 'Авогадро',
    description: 'Офіційний сайт волейбольного клубу «Авогадро»',
    start_url: '/',
    display: 'standalone',
    background_color: '#050d22',
    theme_color: '#050d22',
    icons: [
      { src: '/images/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/images/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
