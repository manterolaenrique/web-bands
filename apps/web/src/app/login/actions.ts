'use server'

import {redirect} from 'next/navigation'

import {appendQueryParams, resolveSafeReturnTo} from '@/lib/auth/return-to'
import {toAuthMessageCode} from '@/lib/auth/messages'
import {isSupabaseConfigured, siteUrl} from '@/lib/env'
import {writeAuditLog} from '@/lib/server/audit'
import {normalizeIdentityEmail, hashIdentityParts} from '@/lib/server/identity'
import {logServerWarning} from '@/lib/server/log'
import {getServerActionRequestContext} from '@/lib/server/request-context'
import {consumeRateLimit, RATE_LIMIT_POLICIES} from '@/lib/server/rate-limit'
import {createClient} from '@/lib/supabase/server'

function getCredentials(formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  if (!email || !password) {
    return null
  }

  return {email, password}
}

function resolveReturnTo(formData: FormData) {
  const next = formData.get('returnTo') || formData.get('next')
  return resolveSafeReturnTo(typeof next === 'string' ? next : undefined)
}

function redirectWithMessage(message: string, returnTo = '/dashboard'): never {
  redirect(
    appendQueryParams('/login', {
      message,
      next: returnTo !== '/dashboard' ? returnTo : undefined,
    })
  )
}

function buildAuthCallbackUrl(returnTo: string) {
  const callbackUrl = new URL('/auth/callback', siteUrl)

  if (returnTo !== '/dashboard') {
    callbackUrl.searchParams.set('next', returnTo)
  }

  return callbackUrl
}

export async function signIn(formData: FormData) {
  const returnTo = resolveReturnTo(formData)
  const requestContext = await getServerActionRequestContext()

  if (!isSupabaseConfigured()) {
    redirectWithMessage('supabase-not-configured', returnTo)
  }

  const credentials = getCredentials(formData)
  if (!credentials) {
    redirectWithMessage('missing-credentials', returnTo)
  }

  const {email, password} = credentials
  const normalizedEmail = normalizeIdentityEmail(email)
  const rateLimitResult = await consumeRateLimit(RATE_LIMIT_POLICIES.login, [
    requestContext.ip,
    normalizedEmail,
  ])

  if (!rateLimitResult.allowed) {
    logServerWarning('rate_limit.blocked', {
      action: 'auth.sign_in',
      bucket: RATE_LIMIT_POLICIES.login.bucket,
      keyHash: rateLimitResult.keyHash,
      requestId: requestContext.requestId,
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
    })
    redirectWithMessage('login-rate-limited', returnTo)
  }

  const supabase = await createClient()
  const {data, error} = await supabase.auth.signInWithPassword({email, password})

  if (error) {
    const messageCode = toAuthMessageCode(error.message)
    await writeAuditLog({
      action: 'auth.login.failed',
      ip: requestContext.ip,
      metadata: {
        reason: messageCode,
        requestId: requestContext.requestId,
        returnTo,
      },
      targetId: hashIdentityParts(['auth_email', normalizedEmail]),
      targetType: 'auth_email',
      userAgent: requestContext.userAgent,
    })
    redirectWithMessage(messageCode, returnTo)
  }

  await writeAuditLog({
    action: 'auth.login.succeeded',
    actorUserId: data.user?.id || null,
    ip: requestContext.ip,
    metadata: {
      requestId: requestContext.requestId,
      returnTo,
    },
    targetId: data.user?.id || hashIdentityParts(['auth_email', normalizedEmail]),
    targetType: data.user?.id ? 'user' : 'auth_email',
    userAgent: requestContext.userAgent,
  })

  redirect(returnTo)
}

export async function signInWithGoogle(formData: FormData) {
  const returnTo = resolveReturnTo(formData)
  const requestContext = await getServerActionRequestContext()

  if (!isSupabaseConfigured()) {
    redirectWithMessage('supabase-not-configured', returnTo)
  }

  const rateLimitResult = await consumeRateLimit(RATE_LIMIT_POLICIES.login, [
    requestContext.ip,
    'oauth:google',
  ])

  if (!rateLimitResult.allowed) {
    logServerWarning('rate_limit.blocked', {
      action: 'auth.sign_in_google',
      bucket: RATE_LIMIT_POLICIES.login.bucket,
      keyHash: rateLimitResult.keyHash,
      requestId: requestContext.requestId,
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
    })
    redirectWithMessage('login-rate-limited', returnTo)
  }

  const supabase = await createClient()
  const callbackUrl = buildAuthCallbackUrl(returnTo)
  const {data, error} = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
    },
  })

  if (error || !data?.url) {
    await writeAuditLog({
      action: 'auth.login.failed',
      ip: requestContext.ip,
      metadata: {
        provider: 'google',
        reason: error?.message || 'google-auth-unavailable',
        requestId: requestContext.requestId,
        returnTo,
      },
      targetId: 'google',
      targetType: 'oauth_provider',
      userAgent: requestContext.userAgent,
    })
    redirectWithMessage('google-auth-unavailable', returnTo)
  }

  redirect(data.url)
}

export async function signUp(formData: FormData) {
  const returnTo = resolveReturnTo(formData)
  const requestContext = await getServerActionRequestContext()

  if (!isSupabaseConfigured()) {
    redirectWithMessage('supabase-not-configured', returnTo)
  }

  const credentials = getCredentials(formData)
  if (!credentials) {
    redirectWithMessage('missing-credentials', returnTo)
  }

  const {email, password} = credentials
  const rateLimitResult = await consumeRateLimit(RATE_LIMIT_POLICIES.login, [
    requestContext.ip,
    normalizeIdentityEmail(email),
  ])

  if (!rateLimitResult.allowed) {
    logServerWarning('rate_limit.blocked', {
      action: 'auth.sign_up',
      bucket: RATE_LIMIT_POLICIES.login.bucket,
      keyHash: rateLimitResult.keyHash,
      requestId: requestContext.requestId,
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
    })
    redirectWithMessage('login-rate-limited', returnTo)
  }

  const supabase = await createClient()
  const callbackUrl = buildAuthCallbackUrl(returnTo)

  const {error} = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl.toString(),
    },
  })

  if (error) {
    redirectWithMessage(toAuthMessageCode(error.message), returnTo)
  }

  redirectWithMessage('signup-confirm-email', returnTo)
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  redirect('/login')
}
