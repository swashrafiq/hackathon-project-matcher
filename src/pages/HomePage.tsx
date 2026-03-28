import { useEffect, useState } from 'react'
import { getApiBaseUrl } from '../config/runtimeConfig'
import { fetchProjects } from '../api/projects'
import { ProjectCard } from '../components/ProjectCard'
import type { ProjectReadModel } from '../types/models'

interface HomePageProps {
  loadProjects?: () => Promise<ProjectReadModel[]>
  canPerformProjectActions?: boolean
}

export function HomePage({
  loadProjects = fetchProjects,
  canPerformProjectActions = true,
}: HomePageProps) {
  const [projects, setProjects] = useState<ProjectReadModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

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

  return (
    <section>
      <h1>Hello Hackathon Project Matcher</h1>
      <p>Step 12 complete: project list/details now use backend read APIs.</p>
      <p>
        Configured backend base URL: <code>{getApiBaseUrl()}</code>
      </p>
      {!canPerformProjectActions ? (
        <p role="status">
          Enter your name and email above to enable project actions like Join.
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
            />
          ))}
        </div>
      )}
    </section>
  )
}
