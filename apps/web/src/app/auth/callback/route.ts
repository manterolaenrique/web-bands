import {NextResponse, type NextRequest} from 'next/server'

import {appendQueryParams, resolveSafeReturnTo} from '@/lib/auth/return-to'
import {isSupabaseConfigured} from '@/lib/env'
import {writeAuditLog} from '@/lib/server/audit'
import {logServerError} from '@/lib/server/log'
import {resolveRequestContext} from '@/lib/server/request-context'
import {createClient} from '@/lib/supabase/server'

function redirectToLogin(requestUrl: URL, message: string, next: string) {
  const loginUrl = new URL(
    appendQueryParams('/login', {
      message,
      next: next !== '/dashboard' ? next : undefined,
    }),
    requestUrl.origin
  )

  return NextResponse.redirect(loginUrl)
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = resolveSafeReturnTo(requestUrl.searchParams.get('next'))
  const providerError = requestUrl.searchParams.get('error')
  const requestContext = resolveRequestContext(request.headers)

  if (!isSupabaseConfigured()) {
    return redirectToLogin(requestUrl, 'supabase-not-configured', next)
  }

  if (providerError) {
    const message = providerError === 'access_denied' ? 'google-auth-cancelled' : 'google-auth-failed'

    await writeAuditLog({
      action: 'auth.login.failed',
      ip: requestContext.ip,
      metadata: {
        provider: 'google',
        providerError,
        providerErrorDescription: requestUrl.searchParams.get('error_description'),
        requestId: requestContext.requestId,
        returnTo: next,
      },
      targetId: 'google',
      targetType: 'oauth_provider',
      userAgent: requestContext.userAgent,
    })

    return redirectToLogin(requestUrl, message, next)
  }

  if (!code) {
    return redirectToLogin(requestUrl, 'google-auth-failed', next)
  }

  try {
    const supabase = await createClient()
    const {error} = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      await writeAuditLog({
        action: 'auth.login.failed',
        ip: requestContext.ip,
        metadata: {
          provider: 'google',
          reason: error.message,
          requestId: requestContext.requestId,
          returnTo: next,
        },
        targetId: 'google',
        targetType: 'oauth_provider',
        userAgent: requestContext.userAgent,
      })

      return redirectToLogin(requestUrl, 'google-auth-failed', next)
    }

    const {
      data: {user},
    } = await supabase.auth.getUser()

    await writeAuditLog({
      action: 'auth.login.succeeded',
      actorUserId: user?.id || null,
      ip: requestContext.ip,
      metadata: {
        provider: 'google',
        requestId: requestContext.requestId,
        returnTo: next,
      },
      targetId: user?.id || 'google',
      targetType: user?.id ? 'user' : 'oauth_provider',
      userAgent: requestContext.userAgent,
    })
  } catch (error) {
    logServerError('auth.google.callback_failed', error, {
      requestId: requestContext.requestId,
      returnTo: next,
    })

    return redirectToLogin(requestUrl, 'google-auth-failed', next)
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
