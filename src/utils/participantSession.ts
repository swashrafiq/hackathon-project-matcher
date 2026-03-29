import { sanitizeText } from './sanitizeText'

export interface ParticipantSession {
  id: string
  name: string
  email: string
  role: 'participant' | 'admin'
  mainProjectId: string | null
  sessionToken: string
}

export const PARTICIPANT_SESSION_STORAGE_KEY = 'hpm-participant-session'

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function normalizeParticipantInput(
  rawName: string,
  rawEmail: string,
): Pick<ParticipantSession, 'name' | 'email'> {
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

  return (
    session.id.length > 0 &&
    session.name.length > 0 &&
    isValidEmail(session.email) &&
    (session.role === 'participant' || session.role === 'admin') &&
    session.sessionToken.length > 0
  )
}

export function readParticipantSession(): ParticipantSession | null {
  try {
    const raw = window.localStorage.getItem(PARTICIPANT_SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as {
      id?: unknown
      name?: unknown
      email?: unknown
      role?: unknown
      mainProjectId?: unknown
      sessionToken?: unknown
    }
    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.name !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.sessionToken !== 'string' ||
      (parsed.role !== 'participant' && parsed.role !== 'admin')
    ) {
      return null
    }

    const normalizedInput = normalizeParticipantInput(parsed.name, parsed.email)
    const normalized: ParticipantSession = {
      id: sanitizeText(parsed.id),
      name: normalizedInput.name,
      email: normalizedInput.email,
      role: parsed.role,
      mainProjectId:
        typeof parsed.mainProjectId === 'string' ? sanitizeText(parsed.mainProjectId) : null,
      sessionToken: sanitizeText(parsed.sessionToken),
    }
    return isValidParticipantSession(normalized) ? normalized : null
  } catch {
    return null
  }
}
