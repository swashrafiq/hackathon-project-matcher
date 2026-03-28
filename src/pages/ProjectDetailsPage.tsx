import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchProjectById } from '../api/projects'
import type { ProjectReadModel } from '../types/models'
import { sanitizeText } from '../utils/sanitizeText'

const PROJECT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/

interface ProjectDetailsPageProps {
  loadProjectById?: (projectId: string) => Promise<ProjectReadModel | null>
}

export function ProjectDetailsPage({
  loadProjectById = fetchProjectById,
}: ProjectDetailsPageProps) {
  const { projectId } = useParams()
  const rawProjectId = projectId ?? 'unknown-project'
  const safeProjectId = sanitizeText(rawProjectId)
  const [project, setProject] = useState<ProjectReadModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

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
      <section>
        <h1>Project Details</h1>
        <p>Loading project details...</p>
      </section>
    )
  }

  if (loadError) {
    return (
      <section>
        <h1>Project Details</h1>
        <p role="status">{loadError}</p>
      </section>
    )
  }

  if (!project) {
    return (
      <section>
        <h1>Project Not Found</h1>
        <p role="status">No project exists for this id.</p>
        <p>
          Requested id: <code>{safeProjectId}</code>
        </p>
      </section>
    )
  }

  return (
    <section>
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      <p>
        Tech stack: <code>{project.techStack}</code>
      </p>
      <p>
        Lead: <code>{project.leadName}</code>
      </p>
      <p>
        Members: <code>{project.memberCount}</code>
      </p>
      <p>
        Status:{' '}
        <span className={`status-badge status-${project.status}`}>{project.status}</span>
      </p>
    </section>
  )
}
