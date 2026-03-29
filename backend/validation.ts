const PROJECT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/
const USER_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface CreateProjectInput {
  title: string
  description: string
  techStack: string
  leadName: string
}

export function sanitizeText(value: string): string {
  return value.replace(/[<>"']/g, '').trim()
}

export function sanitizeEmail(value: string): string {
  return sanitizeText(value).toLowerCase()
}

export function isValidProjectId(projectId: string): boolean {
  return PROJECT_ID_PATTERN.test(projectId)
}

export function isValidUserId(userId: string): boolean {
  return USER_ID_PATTERN.test(userId)
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email)
}

function assertLength(
  value: string,
  fieldName: string,
  minLength: number,
  maxLength: number,
): string {
  const normalized = sanitizeText(value)
  if (normalized.length < minLength || normalized.length > maxLength) {
    throw new Error(`${fieldName} must be between ${minLength} and ${maxLength} characters.`)
  }

  return normalized
}

export function validateCreateProjectPayload(payload: unknown): CreateProjectInput {
  const record = (payload || {}) as Record<string, unknown>

  return {
    title: assertLength(String(record.title || ''), 'Title', 3, 120),
    description: assertLength(String(record.description || ''), 'Description', 10, 1000),
    techStack: assertLength(String(record.techStack || ''), 'Tech stack', 2, 200),
    leadName: assertLength(String(record.leadName || ''), 'Lead name', 2, 120),
  }
}
