import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AppHeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  sessionPanel: ReactNode
  participantMainProjectId?: string | null
}

export function AppHeader({
  theme,
  onToggleTheme,
  sessionPanel,
  participantMainProjectId = null,
}: AppHeaderProps) {
  return (
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
                <Link to="/create-project">Create Project</Link>
              </li>
              {participantMainProjectId ? (
                <li>
                  <Link to={`/projects/${participantMainProjectId}`}>My Project</Link>
                </li>
              ) : null}
            </ul>
          </nav>
          <button
            className="theme-toggle"
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        </div>
      </div>
      <div className="container">{sessionPanel}</div>
    </header>
  )
}
