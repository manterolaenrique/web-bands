import {isSupabaseAdminConfigured} from '@/lib/env'
import {createAdminClient} from '@/lib/supabase/admin'
import {hashIdentityParts} from '@/lib/server/identity'
import {logServerError, logServerInfo} from '@/lib/server/log'

type AuditJsonValue =
  | string
  | number
  | boolean
  | null
  | AuditJsonValue[]
  | {
      [key: string]: AuditJsonValue
    }

export type AuditLogInput = {
  action: string
  actorUserId?: null | string
  bandId?: null | string
  ip?: null | string
  metadata?: Record<string, unknown>
  targetId?: null | string
  targetType: string
  userAgent?: null | string
}

function serializeAuditValue(value: unknown): AuditJsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map((entry) => serializeAuditValue(entry))
  }

  if (typeof value === 'object') {
    const result: Record<string, AuditJsonValue> = {}

    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) {
        continue
      }

      result[key] = serializeAuditValue(entry)
    }

    return result
  }

  return String(value)
}

export function serializeAuditLog(input: AuditLogInput) {
  return {
    action: input.action,
    actor_user_id: input.actorUserId || null,
    band_id: input.bandId || null,
    ip_hash: input.ip ? hashIdentityParts(['ip', input.ip]) : null,
    metadata: serializeAuditValue(input.metadata || {}),
    target_id: input.targetId || null,
    target_type: input.targetType,
    user_agent: input.userAgent?.slice(0, 512) || null,
  }
}

export async function writeAuditLog(input: AuditLogInput) {
  const payload = serializeAuditLog(input)

  if (!isSupabaseAdminConfigured()) {
    logServerInfo('audit.skipped', {
      action: payload.action,
      reason: 'missing_admin_config',
      targetType: payload.target_type,
    })
    return false
  }

  try {
    const admin = createAdminClient()
    const {error} = await admin.from('audit_logs').insert(payload)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    logServerError('audit.write_failed', error, {
      action: payload.action,
      bandId: payload.band_id,
      targetType: payload.target_type,
      targetId: payload.target_id,
    })

    return false
  }
}
