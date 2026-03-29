import { useState } from 'react'
import { type ParticipantSession, PARTICIPANT_SESSION_STORAGE_KEY, readParticipantSession } from '../utils/participantSession'

function persistParticipantSession(session: ParticipantSession | null) {
  try {
    if (session) {
      window.localStorage.setItem(PARTICIPANT_SESSION_STORAGE_KEY, JSON.stringify(session))
      return
    }

    window.localStorage.removeItem(PARTICIPANT_SESSION_STORAGE_KEY)
  } catch {
    // Ignore storage errors; in-memory session still works.
  }
}

export function useParticipantSession() {
  const [participantSession, setParticipantSession] = useState<ParticipantSession | null>(
    readParticipantSession,
  )

  function updateParticipantSession(nextSession: ParticipantSession) {
    setParticipantSession(nextSession)
    persistParticipantSession(nextSession)
  }

  function clearParticipantSession() {
    setParticipantSession(null)
    persistParticipantSession(null)
  }

  return {
    participantSession,
    setParticipantSession: updateParticipantSession,
    clearParticipantSession,
  }
}
