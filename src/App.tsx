import './App.css'
import { type FormEvent, useEffect, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ProjectDetailsPage } from './pages/ProjectDetailsPage'
import { joinProject } from './api/joinProject'
import { leaveProject } from './api/leaveProject'
import { submitParticipantEntry } from './api/participants'
import { switchProject } from './api/switchProject'
import {
  type ParticipantSession,
  isValidEmail,
  normalizeParticipantInput,
  PARTICIPANT_SESSION_STORAGE_KEY,
  readParticipantSession,
} from './utils/participantSession'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'hpm-theme'

function parseTheme(value: string | null): Theme {
  return value === 'dark' || value === 'light' ? value : 'light'
}

function getInitialTheme(): Theme {
  try {
    return parseTheme(window.localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return 'light'
  }
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [participantSession, setParticipantSession] = useState<ParticipantSession | null>(
    readParticipantSession,
  )
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [entryError, setEntryError] = useState<string | null>(null)
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore storage errors and keep default behavior.
    }
  }, [theme])

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
  }

  async function handleEntrySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalized = normalizeParticipantInput(nameInput, emailInput)
    if (normalized.name.length === 0) {
      setEntryError('Please enter your name.')
      return
    }

    if (!isValidEmail(normalized.email)) {
      setEntryError('Please enter a valid email address.')
      return
    }

    try {
      setIsSubmittingEntry(true)
      const response = await submitParticipantEntry(normalized.name, normalized.email)
      const nextSession: ParticipantSession = {
        id: response.participant.id,
        name: response.participant.name,
        email: response.participant.email,
        role: response.participant.role,
        mainProjectId: response.participant.mainProjectId,
      }

      setParticipantSession(nextSession)
      setEntryError(null)
      setNameInput('')
      setEmailInput('')

      try {
        window.localStorage.setItem(
          PARTICIPANT_SESSION_STORAGE_KEY,
          JSON.stringify(nextSession),
        )
      } catch {
        // Ignore storage errors; in-memory session still works.
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to submit participant entry.'
      setEntryError(message)
    } finally {
      setIsSubmittingEntry(false)
    }
  }

  function clearParticipantSession() {
    setParticipantSession(null)

    try {
      window.localStorage.removeItem(PARTICIPANT_SESSION_STORAGE_KEY)
    } catch {
      // Ignore storage errors and continue.
    }
  }

  async function handleJoinProject(projectId: string): Promise<'joined' | 'already_joined'> {
    if (!participantSession) {
      throw new Error('Please enter your name and email first.')
    }

    const response = await joinProject(projectId, participantSession.id)
    const nextSession: ParticipantSession = {
      ...participantSession,
      mainProjectId: response.participant.mainProjectId,
    }

    setParticipantSession(nextSession)
    try {
      window.localStorage.setItem(PARTICIPANT_SESSION_STORAGE_KEY, JSON.stringify(nextSession))
    } catch {
      // Ignore storage errors; in-memory session still works.
    }

    return response.source
  }

  async function handleLeaveProject(projectId: string): Promise<'left'> {
    if (!participantSession) {
      throw new Error('Please enter your name and email first.')
    }

    const response = await leaveProject(projectId, participantSession.id)
    const nextSession: ParticipantSession = {
      ...participantSession,
      mainProjectId: response.participant.mainProjectId,
    }

    setParticipantSession(nextSession)
    try {
      window.localStorage.setItem(PARTICIPANT_SESSION_STORAGE_KEY, JSON.stringify(nextSession))
    } catch {
      // Ignore storage errors; in-memory session still works.
    }

    return response.source
  }

  async function handleSwitchProject(
    projectId: string,
  ): Promise<'switched' | 'already_joined'> {
    if (!participantSession) {
      throw new Error('Please enter your name and email first.')
    }

    const response = await switchProject(projectId, participantSession.id)
    const nextSession: ParticipantSession = {
      ...participantSession,
      mainProjectId: response.participant.mainProjectId,
    }

    setParticipantSession(nextSession)
    try {
      window.localStorage.setItem(PARTICIPANT_SESSION_STORAGE_KEY, JSON.stringify(nextSession))
    } catch {
      // Ignore storage errors; in-memory session still works.
    }

    return response.source
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container app-header-inner">
          <Link className="brand" to="/">
            Hackathon Project Matcher
          </Link>
          <div className="header-controls">
            <nav aria-label="Primary">
              <ul className="nav-list">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/projects/sample-project">Project Details</Link>
                </li>
              </ul>
            </nav>
            <button
              className="theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
              }
            >
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>
        </div>
        <div className="container">
          {participantSession ? (
            <div className="participant-session-banner" role="status">
              <span>
                Signed in as <strong>{participantSession.name}</strong> ({participantSession.email})
              </span>
              <button type="button" className="session-clear-button" onClick={clearParticipantSession}>
                Clear session
              </button>
            </div>
          ) : (
            <form className="participant-entry-form" onSubmit={handleEntrySubmit} noValidate>
              <div className="entry-field-group">
                <label htmlFor="participant-name">Name</label>
                <input
                  id="participant-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
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
                  onChange={(event) => setEmailInput(event.target.value)}
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
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  canPerformProjectActions={Boolean(participantSession)}
                  participantSession={participantSession}
                  onJoinProject={handleJoinProject}
                  onLeaveProject={handleLeaveProject}
                  onSwitchProject={handleSwitchProject}
                />
              }
            />
            <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
            <Route path="*" element={<p>Page not found.</p>} />
          </Routes>
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <small>Single-event prototype for fast team coordination.</small>
        </div>
      </footer>
    </div>
  )
}

export default App
