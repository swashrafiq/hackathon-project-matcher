import { sanitizeText } from './sanitizeText'

export interface ParticipantSession {
  name: string
  email: string
}

export const PARTICIPANT_SESSION_STORAGE_KEY = 'hpm-participant-session'

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function normalizeParticipantInput(
  rawName: string,
  rawEmail: string,
): ParticipantSession {
  return {
    name: sanitizeText(rawName),
    email: sanitizeText(rawEmail).toLowerCase(),
  }
}

export function isValidParticipantSession(
  session: ParticipantSession | null,
): session is ParticipantSession {
  if (!session) {
    return false
  }

  return session.name.length > 0 && isValidEmail(session.email)
}

export function readParticipantSession(): ParticipantSession | null {
  try {
    const raw = window.localStorage.getItem(PARTICIPANT_SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as { name?: unknown; email?: unknown }
    if (typeof parsed.name !== 'string' || typeof parsed.email !== 'string') {
      return null
    }

    const normalized = normalizeParticipantInput(parsed.name, parsed.email)
    return isValidParticipantSession(normalized) ? normalized : null
  } catch {
    return null
  }
}
