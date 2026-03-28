import { useEffect, useState } from 'react'
import { ProjectCard } from '../components/ProjectCard'
import { getMockProjects } from '../data/mockRepository'
import type { Project } from '../types/models'

interface HomePageProps {
  loadProjects?: () => Project[]
  canPerformProjectActions?: boolean
}

export function HomePage({
  loadProjects = getMockProjects,
  canPerformProjectActions = true,
}: HomePageProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const loadedProjects = loadProjects()
      setProjects(loadedProjects)
      setIsLoading(false)
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadProjects])

  return (
    <section>
      <h1>Hello Hackathon Project Matcher</h1>
      <p>Step 9 complete: onboarding and action gating are now available.</p>
      {!canPerformProjectActions ? (
        <p role="status">
          Enter your name and email above to enable project actions like Join.
        </p>
      ) : null}

      {isLoading ? (
        <p>Loading projects...</p>
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
