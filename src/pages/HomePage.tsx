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
}

export function HomePage({
  loadProjects = fetchProjects,
  canPerformProjectActions = true,
  participantSession = null,
  onJoinProject,
}: HomePageProps) {
  const [projects, setProjects] = useState<ProjectReadModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinMessage, setJoinMessage] = useState<string | null>(null)
  const [joiningProjectId, setJoiningProjectId] = useState<string | null>(null)

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

  async function handleJoinProject(projectId: string) {
    if (!onJoinProject) {
      return
    }

    setJoinError(null)
    setJoinMessage(null)
    setJoiningProjectId(projectId)

    try {
      const source = await onJoinProject(projectId)
      const latestProjects = await loadProjects()
      setProjects(latestProjects)
      setJoinMessage(
        source === 'already_joined'
          ? 'You are already joined to this project.'
          : 'Project joined successfully.',
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to join project right now.'
      setJoinError(message)
    } finally {
      setJoiningProjectId(null)
    }
  }

  return (
    <section>
      <h1>Hello Hackathon Project Matcher</h1>
      <p>Step 14 in progress: join actions now call backend API rules.</p>
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
            <ProjectCard
              key={project.id}
              project={project}
              canPerformProjectActions={canPerformProjectActions}
              isCurrentMainProject={participantSession?.mainProjectId === project.id}
              isJoining={joiningProjectId === project.id}
              onJoinProject={handleJoinProject}
            />
          ))}
        </div>
      )}
    </section>
  )
}
