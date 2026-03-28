import { Link } from 'react-router-dom'
import type { Project } from '../types/models'
import { sanitizeText } from '../utils/sanitizeText'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const safeTitle = sanitizeText(project.title)
  const safeDescription = sanitizeText(project.description)
  const safeLeadName = sanitizeText(project.leadName)

  return (
    <article className="project-card" aria-label={`Project card: ${safeTitle}`}>
      <h2>{safeTitle}</h2>
      <p>{safeDescription}</p>
      <p>
        Lead: <code>{safeLeadName}</code>
      </p>
      <p>
        Members: <code>{project.memberCount}</code> | Status: <code>{project.status}</code>
      </p>
      <Link to={`/projects/${project.id}`}>View details</Link>
    </article>
  )
}
