import type {Metadata} from 'next'
import Link from 'next/link'
import type {ReactNode} from 'react'

import {siteUrl} from '@/lib/env'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Web Bands',
    template: '%s | Web Bands',
  },
  description: 'Plataforma profesional para bandas de musica.',
}

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        <div className="app-shell">
          <header className="site-header">
            <div className="site-header__inner">
              <Link href="/" className="brand">
                <span className="brand__mark">WB</span>
                <span>Web Bands</span>
              </Link>
              <nav className="site-nav" aria-label="Principal">
                <Link href="/" className="nav-link">
                  Bandas
                </Link>
                <Link href="/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <Link href="/login" className="button button--primary">
                  Login
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
