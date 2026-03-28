import { Link } from 'react-router-dom'
import type { ProjectReadModel } from '../types/models'
import { sanitizeText } from '../utils/sanitizeText'

interface ProjectCardProps {
  project: ProjectReadModel
  canPerformProjectActions?: boolean
  isCurrentMainProject?: boolean
  isProjectFull?: boolean
  actionKind?: 'join' | 'switch' | 'leave'
  isSubmittingAction?: boolean
  onProjectAction?: (projectId: string) => void
}

export function ProjectCard({
  project,
  canPerformProjectActions = true,
  isCurrentMainProject = false,
  isProjectFull = false,
  actionKind = 'join',
  isSubmittingAction = false,
  onProjectAction,
}: ProjectCardProps) {
  const safeTitle = sanitizeText(project.title)
  const safeDescription = sanitizeText(project.description)
  const safeLeadName = sanitizeText(project.leadName)

  const isJoinOrSwitch = actionKind === 'join' || actionKind === 'switch'
  const isDisabled =
    !canPerformProjectActions || isSubmittingAction || (isJoinOrSwitch && isProjectFull)
  const actionLabel = isSubmittingAction
    ? actionKind === 'leave'
      ? 'Giving up...'
      : actionKind === 'switch'
        ? 'Switching...'
        : 'Joining...'
    : actionKind === 'leave'
      ? 'Give up current project'
      : actionKind === 'switch'
        ? 'Switch to this project'
        : 'Join project'

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
        disabled={isDisabled}
        onClick={() => onProjectAction?.(project.id)}
      >
        {actionLabel}
      </button>
      {!canPerformProjectActions ? (
        <p role="note">Complete name/email entry to use project actions.</p>
      ) : isCurrentMainProject ? (
        <p role="note">This is your current main project.</p>
      ) : isProjectFull ? (
        <p role="note">Project is full (max 5 members).</p>
      ) : null}
      <Link to={`/projects/${project.id}`}>View details</Link>
    </article>
  )
}
