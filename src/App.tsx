import './App.css'
import { useEffect, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ProjectDetailsPage } from './pages/ProjectDetailsPage'

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
      </header>

      <main className="app-main">
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
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
