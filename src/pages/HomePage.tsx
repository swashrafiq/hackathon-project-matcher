import { useEffect, useState } from 'react'
import { fetchProjects } from '../api/projects'
import { ProjectCard } from '../components/ProjectCard'
import type { ProjectReadModel } from '../types/models'
import type { ParticipantSession } from '../utils/participantSession'

interface HomePageProps {
  loadProjects?: () => Promise<ProjectReadModel[]>
  canPerformProjectActions?: boolean
  participantSession?: ParticipantSession | null
  watchedProjectIds?: string[]
  onJoinProject?: (projectId: string) => Promise<'joined' | 'already_joined'>
  onLeaveProject?: (projectId: string) => Promise<'left'>
  onSwitchProject?: (projectId: string) => Promise<'switched' | 'already_joined'>
  onToggleWatch?: (projectId: string) => Promise<void>
}

export function HomePage({
  loadProjects = fetchProjects,
  canPerformProjectActions = true,
  participantSession = null,
  watchedProjectIds = [],
  onJoinProject,
  onLeaveProject,
  onSwitchProject,
  onToggleWatch,
}: HomePageProps) {
  const [projects, setProjects] = useState<ProjectReadModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinMessage, setJoinMessage] = useState<string | null>(null)
  const [submittingProjectId, setSubmittingProjectId] = useState<string | null>(null)
  const [watchError, setWatchError] = useState<string | null>(null)
  const [watchMessage, setWatchMessage] = useState<string | null>(null)
  const [watchSubmittingProjectId, setWatchSubmittingProjectId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setLoadError(null)

      loadProjects()
        .then((loadedProjects) => {
          if (!isMounted) {
            return
          }

          setProjects(loadedProjects)
        })
        .catch(() => {
          if (!isMounted) {
            return
          }

          setLoadError('Unable to load projects right now.')
        })
        .finally(() => {
          if (!isMounted) {
            return
          }

          setIsLoading(false)
        })
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timer)
    }
  }, [loadProjects])

  async function handleProjectAction(projectId: string) {
    if (!participantSession) {
      setJoinError('Please enter your name and email first.')
      return
    }

    const isCurrentMainProject = participantSession.mainProjectId === projectId
    const actionKind =
      participantSession.mainProjectId === null
        ? 'join'
        : isCurrentMainProject
          ? 'leave'
          : 'switch'

    setJoinError(null)
    setJoinMessage(null)
    setSubmittingProjectId(projectId)

    try {
      let source: 'joined' | 'already_joined' | 'left' | 'switched'
      if (actionKind === 'join') {
        if (!onJoinProject) {
          return
        }
        source = await onJoinProject(projectId)
      } else if (actionKind === 'leave') {
        if (!onLeaveProject) {
          return
        }
        source = await onLeaveProject(projectId)
      } else {
        if (!onSwitchProject) {
          return
        }
        source = await onSwitchProject(projectId)
      }

      const latestProjects = await loadProjects()
      setProjects(latestProjects)

      if (source === 'already_joined') {
        setJoinMessage('You are already joined to this project.')
      } else if (actionKind === 'leave') {
        setJoinMessage('You left your current main project.')
      } else if (actionKind === 'switch') {
        setJoinMessage('Main project switched successfully.')
      } else {
        setJoinMessage('Project joined successfully.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to join project right now.'
      setJoinError(message)
    } finally {
      setSubmittingProjectId(null)
    }
  }

  async function handleWatchToggle(projectId: string) {
    if (!participantSession || !onToggleWatch) {
      setWatchError('Please enter your name and email first.')
      return
    }

    setWatchError(null)
    setWatchMessage(null)
    setWatchSubmittingProjectId(projectId)
    try {
      const wasWatched = watchedProjectIds.includes(projectId)
      await onToggleWatch(projectId)
      setWatchMessage(wasWatched ? 'Project removed from watchlist.' : 'Project added to watchlist.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update watchlist right now.'
      setWatchError(message)
    } finally {
      setWatchSubmittingProjectId(null)
    }
  }

  return (
    <section className="page-stack" aria-label="Projects dashboard">
      <header className="page-hero">
        <h1>Discover hackathon projects</h1>
        <p className="hero-subtitle">Join a project, switch your focus, and browse full project details.</p>
      </header>
      {!canPerformProjectActions ? (
        <p role="status" className="status-message">
          Enter your name and email above to enable project actions like Join.
        </p>
      ) : null}
      {joinMessage ? (
        <p role="status" className="status-message">
          {joinMessage}
        </p>
      ) : null}
      {joinError ? (
        <p role="alert" className="entry-error-text">
          {joinError}
        </p>
      ) : null}
      {watchMessage ? (
        <p role="status" className="status-message">
          {watchMessage}
        </p>
      ) : null}
      {watchError ? (
        <p role="alert" className="entry-error-text">
          {watchError}
        </p>
      ) : null}
      {isLoading ? (
        <p>Loading projects...</p>
      ) : loadError ? (
        <p role="status" className="status-message">
          {loadError}
        </p>
      ) : projects.length === 0 ? (
        <p className="status-message">No projects available yet.</p>
      ) : (
        <section className="project-results" aria-label="Project list">
          <div className="project-results-header">
            <h2>Open projects</h2>
            <p className="muted-text">{projects.length} projects available</p>
          </div>
          <div className="project-grid">
            {projects.map((project) => (
              // Action type depends on current participant state.
              <ProjectCard
                key={project.id}
                project={project}
                canPerformProjectActions={canPerformProjectActions}
                isCurrentMainProject={participantSession?.mainProjectId === project.id}
                isProjectFull={project.memberCount >= 5}
                isWatched={watchedProjectIds.includes(project.id)}
                isTogglingWatch={watchSubmittingProjectId === project.id}
                actionKind={
                  !participantSession
                    ? 'join'
                    : participantSession.mainProjectId === null
                      ? 'join'
                      : participantSession.mainProjectId === project.id
                        ? 'leave'
                        : 'switch'
                }
                isSubmittingAction={submittingProjectId === project.id}
                onProjectAction={handleProjectAction}
                onWatchToggle={handleWatchToggle}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  )
}
