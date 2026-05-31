type LogContextValue = string | number | boolean | null | undefined

function serializeLog(event: string, level: 'error' | 'info' | 'warn', context: Record<string, LogContextValue>) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  })
}

function serializeErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5).join('\n') || undefined,
    }
  }

  if (typeof error === 'object' && error !== null) {
    const details: Record<string, string | number | boolean | null | undefined> = {}

    for (const [key, value] of Object.entries(error)) {
      if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        details[key] = value
      } else if (value !== undefined) {
        details[key] = String(value)
      }
    }

    if (Object.keys(details).length > 0) {
      return details
    }
  }

  return {
    message: String(error),
  }
}

export function logServerInfo(event: string, context: Record<string, LogContextValue> = {}) {
  console.log(serializeLog(event, 'info', context))
}

export function logServerWarning(event: string, context: Record<string, LogContextValue> = {}) {
  console.warn(serializeLog(event, 'warn', context))
}

export function logServerError(
  event: string,
  error: unknown,
  context: Record<string, LogContextValue> = {}
) {
  const details = serializeErrorDetails(error)
  console.error(serializeLog(event, 'error', {...context, error: JSON.stringify(details)}))
}
