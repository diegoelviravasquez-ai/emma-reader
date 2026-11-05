import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import { EmmaProvider } from '@/components/providers/emma-store'
import { ServiceWorker } from '@/components/shell/service-worker'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'opsz'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: 'EMMA · Lee a tu ritmo',
  description:
    'La única inteligencia artificial que quiere que la necesites menos. Lectura con facilitación prosódica, offline, en el dispositivo.',
  applicationName: 'EMMA',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
  appleWebApp: { capable: true, title: 'EMMA', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf7f2' },
    { media: '(prefers-color-scheme: dark)', color: '#16120f' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const settingsBoot = `(()=>{try{const s=JSON.parse(localStorage.getItem('emma:ajustes')||'{}');const r=document.documentElement;const d=s.theme==='oscuro'||((!s.theme||s.theme==='sistema')&&matchMedia('(prefers-color-scheme: dark)').matches);r.classList.toggle('dark',d);r.classList.toggle('text-large',!!s.largeText);r.classList.toggle('reduce-motion',!!s.reduceMotion)}catch(e){}})()`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable} bg-background`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: settingsBoot }} />
      </head>
      <body className="grain antialiased">
        <div className="halo" aria-hidden="true" />
        <EmmaProvider>{children}</EmmaProvider>
        <ServiceWorker />
      </body>
    </html>
  )
}
