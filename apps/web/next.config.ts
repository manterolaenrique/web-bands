import type {NextConfig} from 'next'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const appRoot = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(appRoot, '../..')
const isProduction = process.env.NODE_ENV === 'production'

function buildContentSecurityPolicyReportOnly() {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https://cdn.sanity.io https://*.sanity.io",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "font-src 'self' data:",
    "media-src 'self' https: data: blob:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in https://*.sanity.io https://cdn.sanity.io https://api.resend.com ws: wss:",
    'report-uri /api/security/csp-report',
  ].join('; ')
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ['127.0.0.1'],
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
      {
        key: 'Content-Security-Policy-Report-Only',
        value: buildContentSecurityPolicyReportOnly(),
      },
    ]

    if (isProduction) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      })
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/studio/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ]
  },
}

export default nextConfig
