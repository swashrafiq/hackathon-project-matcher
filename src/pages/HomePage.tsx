import { useEffect, useState } from 'react'
import { getApiBaseUrl } from '../config/runtimeConfig'
import { fetchProjects } from '../api/projects'
import { ProjectCard } from '../components/ProjectCard'
import type { ProjectReadModel } from '../types/models'
import type { ParticipantSession } from '../utils/participantSession'

interface HomePageProps {
  loadProjects?: () => Promise<ProjectReadModel[]>
  canPerformProjectActions?: boolean
  participantSession?: ParticipantSession | null
  onJoinProject?: (projectId: string) => Promise<'joined' | 'already_joined'>
  onLeaveProject?: (projectId: string) => Promise<'left'>
  onSwitchProject?: (projectId: string) => Promise<'switched' | 'already_joined'>
}

export function HomePage({
  loadProjects = fetchProjects,
  canPerformProjectActions = true,
  participantSession = null,
  onJoinProject,
  onLeaveProject,
  onSwitchProject,
}: HomePageProps) {
  const [projects, setProjects] = useState<ProjectReadModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinMessage, setJoinMessage] = useState<string | null>(null)
  const [submittingProjectId, setSubmittingProjectId] = useState<string | null>(null)

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

  return (
    <section>
      <h1>Hello Hackathon Project Matcher</h1>
      <p>Steps 15-17 complete: capacity, leave, and switch membership flows are live.</p>
      <p>
        Configured backend base URL: <code>{getApiBaseUrl()}</code>
      </p>
      {!canPerformProjectActions ? (
        <p role="status">
          Enter your name and email above to enable project actions like Join.
        </p>
      ) : null}
      {joinMessage ? <p role="status">{joinMessage}</p> : null}
      {joinError ? (
        <p role="alert" className="entry-error-text">
          {joinError}
        </p>
      ) : null}

      {isLoading ? (
        <p>Loading projects...</p>
      ) : loadError ? (
        <p role="status">{loadError}</p>
      ) : projects.length === 0 ? (
        <p>No projects available yet.</p>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            // Action type depends on current participant state.
            <ProjectCard
              key={project.id}
              project={project}
              canPerformProjectActions={canPerformProjectActions}
              isCurrentMainProject={participantSession?.mainProjectId === project.id}
              isProjectFull={project.memberCount >= 5}
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
            />
          ))}
        </div>
      )}
    </section>
  )
}
