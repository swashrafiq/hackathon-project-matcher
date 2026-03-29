import type { FormEvent } from 'react'
import type { ParticipantSession } from '../utils/participantSession'

interface ParticipantSessionPanelProps {
  participantSession: ParticipantSession | null
  nameInput: string
  emailInput: string
  isSubmittingEntry: boolean
  entryError: string | null
  onNameChange: (nextValue: string) => void
  onEmailChange: (nextValue: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClearSession: () => void
}

export function ParticipantSessionPanel({
  participantSession,
  nameInput,
  emailInput,
  isSubmittingEntry,
  entryError,
  onNameChange,
  onEmailChange,
  onSubmit,
  onClearSession,
}: ParticipantSessionPanelProps) {
  if (participantSession) {
    return (
      <div className="participant-session-banner" role="status">
        <span>
          Signed in as <strong>{participantSession.name}</strong> ({participantSession.email})
          {participantSession.role === 'admin' ? ' [Admin]' : ''}
        </span>
        <button type="button" className="session-clear-button" onClick={onClearSession}>
          Clear session
        </button>
      </div>
    )
  }

  return (
    <form className="participant-entry-form" onSubmit={onSubmit} noValidate>
      <div className="entry-field-group">
        <label htmlFor="participant-name">Name</label>
        <input
          id="participant-name"
          name="name"
          type="text"
          autoComplete="name"
          value={nameInput}
          onChange={(event) => onNameChange(event.target.value)}
          required
        />
      </div>
      <div className="entry-field-group">
        <label htmlFor="participant-email">Email</label>
        <input
          id="participant-email"
          name="email"
          type="email"
          autoComplete="email"
          value={emailInput}
          onChange={(event) => onEmailChange(event.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={isSubmittingEntry}>
        {isSubmittingEntry ? 'Entering...' : 'Enter hackathon'}
      </button>
      {entryError ? (
        <p role="alert" className="entry-error-text">
          {entryError}
        </p>
      ) : null}
    </form>
  )
}
