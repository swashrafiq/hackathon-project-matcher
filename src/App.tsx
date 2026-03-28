import './App.css'
import { type FormEvent, useEffect, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ProjectDetailsPage } from './pages/ProjectDetailsPage'
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

  function handleEntrySubmit(event: FormEvent<HTMLFormElement>) {
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

    setParticipantSession(normalized)
    setEntryError(null)
    setNameInput('')
    setEmailInput('')

    try {
      window.localStorage.setItem(
        PARTICIPANT_SESSION_STORAGE_KEY,
        JSON.stringify(normalized),
      )
    } catch {
      // Ignore storage errors; in-memory session still works.
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
              <button type="submit">Enter hackathon</button>
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
              element={<HomePage canPerformProjectActions={Boolean(participantSession)} />}
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
