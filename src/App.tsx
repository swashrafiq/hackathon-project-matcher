import './App.css'
import { type FormEvent, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { completeProjectAsAdmin } from './api/admin'
import { createProjectByParticipant } from './api/createProject'
import { AppHeader } from './components/AppHeader'
import { ParticipantSessionPanel } from './components/ParticipantSessionPanel'
import { CreateProjectPage } from './pages/CreateProjectPage'
import { HomePage } from './pages/HomePage'
import { ProjectDetailsPage } from './pages/ProjectDetailsPage'
import { joinProject } from './api/joinProject'
import { leaveProject } from './api/leaveProject'
import { submitParticipantEntry } from './api/participants'
import { switchProject } from './api/switchProject'
import { useParticipantSession } from './hooks/useParticipantSession'
import { useTheme } from './hooks/useTheme'
import {
  fetchWatchedProjectIds,
  unwatchProjectByParticipant,
  watchProjectByParticipant,
} from './api/watches'
import { type ParticipantSession, isValidEmail, normalizeParticipantInput } from './utils/participantSession'

function App() {
  const { theme, toggleTheme } = useTheme()
  const { participantSession, setParticipantSession, clearParticipantSession } = useParticipantSession()
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [entryError, setEntryError] = useState<string | null>(null)
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false)
  const [watchedProjectIds, setWatchedProjectIds] = useState<string[]>([])
  const [watchSubmittingProjectId, setWatchSubmittingProjectId] = useState<string | null>(null)

  useEffect(() => {
    if (!participantSession) {
      setWatchedProjectIds([])
      return
    }

    let isMounted = true
    fetchWatchedProjectIds(participantSession.id)
      .then((ids) => {
        if (!isMounted) {
          return
        }
        setWatchedProjectIds(ids)
      })
      .catch(() => {
        if (!isMounted) {
          return
        }
        setWatchedProjectIds([])
      })

    return () => {
      isMounted = false
    }
  }, [participantSession])

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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to submit participant entry.'
      setEntryError(message)
    } finally {
      setIsSubmittingEntry(false)
    }
  }

  function handleClearParticipantSession() {
    setWatchedProjectIds([])
    clearParticipantSession()
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

    return response.source
  }

  async function handleToggleWatch(projectId: string): Promise<void> {
    if (!participantSession) {
      throw new Error('Please enter your name and email first.')
    }

    setWatchSubmittingProjectId(projectId)
    try {
      const nextWatchedProjectIds = watchedProjectIds.includes(projectId)
        ? await unwatchProjectByParticipant(participantSession.id, projectId)
        : await watchProjectByParticipant(participantSession.id, projectId)

      setWatchedProjectIds(nextWatchedProjectIds)
    } finally {
      setWatchSubmittingProjectId(null)
    }
  }

  async function handleCreateProject(input: {
    title: string
    description: string
    techStack: string
    leadName: string
  }): Promise<void> {
    if (!participantSession) {
      throw new Error('Please enter your name and email first.')
    }

    const response = await createProjectByParticipant(participantSession.id, input)
    const nextSession: ParticipantSession = {
      ...participantSession,
      mainProjectId: response.participant.mainProjectId,
    }
    setParticipantSession(nextSession)
  }

  async function handleCompleteProject(projectId: string): Promise<void> {
    if (!participantSession) {
      throw new Error('Please enter your name and email first.')
    }

    await completeProjectAsAdmin(projectId, participantSession.id)
  }

  return (
    <div className="app-shell">
      <AppHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        participantMainProjectId={participantSession?.mainProjectId ?? null}
        sessionPanel={
          <ParticipantSessionPanel
            participantSession={participantSession}
            nameInput={nameInput}
            emailInput={emailInput}
            isSubmittingEntry={isSubmittingEntry}
            entryError={entryError}
            onNameChange={setNameInput}
            onEmailChange={setEmailInput}
            onSubmit={handleEntrySubmit}
            onClearSession={handleClearParticipantSession}
          />
        }
      />

      <main className="app-main">
        <div className="container">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  canPerformProjectActions={Boolean(participantSession)}
                  participantSession={participantSession}
                  watchedProjectIds={watchedProjectIds}
                  onJoinProject={handleJoinProject}
                  onLeaveProject={handleLeaveProject}
                  onSwitchProject={handleSwitchProject}
                  onToggleWatch={handleToggleWatch}
                />
              }
            />
            <Route
              path="/create-project"
              element={
                <CreateProjectPage
                  canPerformProjectActions={Boolean(participantSession)}
                  participantSession={participantSession}
                  onCreateProject={handleCreateProject}
                />
              }
            />
            <Route
              path="/projects/sample-project"
              element={<Navigate to="/projects/proj-smart-schedule" replace />}
            />
            <Route
              path="/projects/:projectId"
              element={
                <ProjectDetailsPage
                  canPerformProjectActions={Boolean(participantSession)}
                  watchedProjectIds={watchedProjectIds}
                  isWatchSubmitting={Boolean(watchSubmittingProjectId)}
                  onToggleWatch={handleToggleWatch}
                  canCompleteProject={participantSession?.role === 'admin'}
                  onCompleteProject={handleCompleteProject}
                />
              }
            />
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
