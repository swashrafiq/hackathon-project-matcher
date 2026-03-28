import { Link } from 'react-router-dom'
import type { ProjectReadModel } from '../types/models'
import { sanitizeText } from '../utils/sanitizeText'

interface ProjectCardProps {
  project: ProjectReadModel
  canPerformProjectActions?: boolean
  isCurrentMainProject?: boolean
  isJoining?: boolean
  onJoinProject?: (projectId: string) => void
}

export function ProjectCard({
  project,
  canPerformProjectActions = true,
  isCurrentMainProject = false,
  isJoining = false,
  onJoinProject,
}: ProjectCardProps) {
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
      <button
        type="button"
        disabled={!canPerformProjectActions || isJoining || isCurrentMainProject}
        onClick={() => onJoinProject?.(project.id)}
      >
        {isJoining
          ? 'Joining...'
          : isCurrentMainProject
            ? 'Main project selected'
            : 'Join project'}
      </button>
      {!canPerformProjectActions ? (
        <p role="note">Complete name/email entry to use project actions.</p>
      ) : isCurrentMainProject ? (
        <p role="note">This is your current main project.</p>
      ) : null}
      <Link to={`/projects/${project.id}`}>View details</Link>
    </article>
  )
}
