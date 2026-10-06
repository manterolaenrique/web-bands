import type {Metadata, Viewport} from 'next'
import Link from 'next/link'
import {Cormorant_Garamond, Inter, Montserrat, Oswald} from 'next/font/google'
import type {ReactNode} from 'react'
import {SpeedInsights} from '@vercel/speed-insights/next'

import {SiteHeader} from '@/components/layout/SiteHeader'
import {AppRuntimeBridge} from '@/components/pwa/AppRuntimeBridge'
import {siteUrl} from '@/lib/env'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['700', '800', '900'],
})

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-stage',
  weight: ['500', '600', '700'],
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-editorial',
  weight: ['600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Web Bands',
    template: '%s | Web Bands',
  },
  description: 'Plataforma profesional para bandas de musica.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Web Bands',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050505',
}

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${montserrat.variable} ${oswald.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <body>
        <AppRuntimeBridge />
        <div className="app-shell">
          <SiteHeader />
          {children}
          <footer className="site-footer">
            <div className="site-footer__inner">
              <div>
                <p className="eyebrow">Web Bands Platform</p>
                <h2 className="site-footer__brand">Experiencia Web Bands</h2>
                <p className="muted">
                  Directorio, dashboards privados y perfiles publicos con una identidad visual
                  unificada.
                </p>
              </div>
              <div className="site-footer__links" aria-label="Enlaces de navegacion principal">
                <Link href="/">Bandas</Link>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/login">Login</Link>
              </div>
            </div>
          </footer>
        </div>
        <SpeedInsights />
      </body>
    </html>
  )
}
