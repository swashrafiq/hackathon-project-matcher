import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchProjectById } from '../api/projects'
import type { ProjectReadModel } from '../types/models'
import { sanitizeText } from '../utils/sanitizeText'

const PROJECT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/

interface ProjectDetailsPageProps {
  loadProjectById?: (projectId: string) => Promise<ProjectReadModel | null>
  canPerformProjectActions?: boolean
  watchedProjectIds?: string[]
  isWatchSubmitting?: boolean
  onToggleWatch?: (projectId: string) => Promise<void>
  canCompleteProject?: boolean
  onCompleteProject?: (projectId: string) => Promise<void>
}

export function ProjectDetailsPage({
  loadProjectById = fetchProjectById,
  canPerformProjectActions = false,
  watchedProjectIds = [],
  isWatchSubmitting = false,
  onToggleWatch,
  canCompleteProject = false,
  onCompleteProject,
}: ProjectDetailsPageProps) {
  const { projectId } = useParams()
  const rawProjectId = projectId ?? 'unknown-project'
  const safeProjectId = sanitizeText(rawProjectId)
  const [project, setProject] = useState<ProjectReadModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [watchError, setWatchError] = useState<string | null>(null)
  const [watchMessage, setWatchMessage] = useState<string | null>(null)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const [completeMessage, setCompleteMessage] = useState<string | null>(null)
  const [isCompletingProject, setIsCompletingProject] = useState(false)

  useEffect(() => {
    let isMounted = true
    const timer = window.setTimeout(() => {
      if (!PROJECT_ID_PATTERN.test(rawProjectId)) {
        setProject(null)
        setLoadError(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError(null)

      loadProjectById(safeProjectId)
        .then((loadedProject) => {
          if (!isMounted) {
            return
          }

          setProject(loadedProject)
        })
        .catch(() => {
          if (!isMounted) {
            return
          }

          setProject(null)
          setLoadError('Unable to load project details right now.')
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
  }, [loadProjectById, rawProjectId, safeProjectId])

  if (isLoading) {
    return (
      <section className="page-stack">
        <h1>Project Details</h1>
        <p>Loading project details...</p>
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="page-stack">
        <h1>Project Details</h1>
        <p role="status" className="status-message">
          {loadError}
        </p>
      </section>
    )
  }

  if (!project) {
    return (
      <section className="page-stack">
        <h1>Project Not Found</h1>
        <p role="status" className="status-message">
          No project exists for this id.
        </p>
        <p>
          Requested id: <code>{safeProjectId}</code>
        </p>
      </section>
    )
  }

  async function handleWatchToggle() {
    if (!onToggleWatch) {
      return
    }

    setWatchError(null)
    setWatchMessage(null)
    const wasWatched = watchedProjectIds.includes(project.id)

    try {
      await onToggleWatch(project.id)
      setWatchMessage(wasWatched ? 'Project removed from watchlist.' : 'Project added to watchlist.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update watchlist right now.'
      setWatchError(message)
    }
  }

  async function handleCompleteProject() {
    if (!onCompleteProject || !project) {
      return
    }

    setCompleteError(null)
    setCompleteMessage(null)
    setIsCompletingProject(true)
    try {
      await onCompleteProject(project.id)
      setProject((current) => (current ? { ...current, status: 'completed' } : current))
      setCompleteMessage('Project marked as completed.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete project right now.'
      setCompleteError(message)
    } finally {
      setIsCompletingProject(false)
    }
  }

  return (
    <section className="page-stack">
      <header className="page-hero">
        <h1>{project.title}</h1>
        <p className="hero-subtitle">{project.description}</p>
      </header>
      <section className="surface-panel" aria-label="Project details">
        <dl className="project-metadata">
          <div>
            <dt>Tech stack</dt>
            <dd>{project.techStack}</dd>
          </div>
          <div>
            <dt>Lead</dt>
            <dd>{project.leadName}</dd>
          </div>
          <div>
            <dt>Members</dt>
            <dd>{project.memberCount}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`status-badge status-${project.status}`}>{project.status}</span>
            </dd>
          </div>
        </dl>
        <div className="project-card-actions">
          <button
            type="button"
            className="button-secondary"
            disabled={!canPerformProjectActions || isWatchSubmitting}
            onClick={handleWatchToggle}
          >
            {isWatchSubmitting
              ? 'Saving watch...'
              : watchedProjectIds.includes(project.id)
                ? 'Unwatch project'
                : 'Watch project'}
          </button>
          {canCompleteProject ? (
            <button type="button" disabled={isCompletingProject} onClick={handleCompleteProject}>
              {isCompletingProject ? 'Completing...' : 'Mark project completed'}
            </button>
          ) : null}
        </div>
      </section>
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
      {completeMessage ? (
        <p role="status" className="status-message">
          {completeMessage}
        </p>
      ) : null}
      {completeError ? (
        <p role="alert" className="entry-error-text">
          {completeError}
        </p>
      ) : null}
      {!canPerformProjectActions ? (
        <p role="note" className="helper-text">
          Complete name/email entry to use project actions.
        </p>
      ) : watchedProjectIds.includes(project.id) ? (
        <p role="note" className="helper-text">
          You are watching this project.
        </p>
      ) : null}
    </section>
  )
}
