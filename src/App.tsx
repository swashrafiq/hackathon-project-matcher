import './App.css'
import { Link, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ProjectDetailsPage } from './pages/ProjectDetailsPage'

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container app-header-inner">
          <Link className="brand" to="/">
            Hackathon Project Matcher
          </Link>
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
