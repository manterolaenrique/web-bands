import {NextResponse, type NextRequest} from 'next/server'

import {logServerWarning} from '@/lib/server/log'
import {resolveRequestContext} from '@/lib/server/request-context'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const requestContext = resolveRequestContext(request.headers)
  const body = await request.json().catch(() => null)
  const report = body && typeof body === 'object' ? ((body as Record<string, unknown>)['csp-report'] ?? body) : body
  const normalizedReport = report && typeof report === 'object' ? (report as Record<string, unknown>) : {}

  logServerWarning('security.csp_report', {
    blockedUri:
      typeof normalizedReport['blocked-uri'] === 'string' ? normalizedReport['blocked-uri'] : 'unknown',
    documentUri:
      typeof normalizedReport['document-uri'] === 'string' ? normalizedReport['document-uri'] : 'unknown',
    effectiveDirective:
      typeof normalizedReport['effective-directive'] === 'string'
        ? normalizedReport['effective-directive']
        : 'unknown',
    requestId: requestContext.requestId,
  })

  return new NextResponse(null, {status: 204})
}
