interface LogContext {
  [key: string]: string | number | boolean | null | undefined
}

function redactValue(key: string, value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) {
    return value
  }

  if (key.toLowerCase().includes('email') && typeof value === 'string') {
    const atIndex = value.indexOf('@')
    if (atIndex <= 1) {
      return '***'
    }
    return `${value.slice(0, 1)}***${value.slice(atIndex)}`
  }

  return value
}

export function logAction(action: string, context: LogContext = {}): void {
  const safeContext: LogContext = {}
  for (const [key, value] of Object.entries(context)) {
    safeContext[key] = redactValue(key, value)
  }

  console.log(
    JSON.stringify({
      level: 'info',
      action,
      context: safeContext,
      at: new Date().toISOString(),
    }),
  )
}

export function reportError(error: unknown, context: LogContext = {}): void {
  const message = error instanceof Error ? error.message : 'Unknown error'
  const safeContext: LogContext = {}
  for (const [key, value] of Object.entries(context)) {
    safeContext[key] = redactValue(key, value)
  }

  console.error(
    JSON.stringify({
      level: 'error',
      message,
      context: safeContext,
      at: new Date().toISOString(),
    }),
  )
}
