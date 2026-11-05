import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EMMA · Lee a tu ritmo',
    short_name: 'EMMA',
    description: 'Lectura con facilitación prosódica. Offline, en el dispositivo.',
    start_url: '/',
    display: 'fullscreen',
    orientation: 'any',
    background_color: '#faf7f2',
    theme_color: '#1f7a6b',
    lang: 'es',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}
