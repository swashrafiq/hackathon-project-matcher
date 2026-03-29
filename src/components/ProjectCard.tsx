import { Link } from 'react-router-dom'
import type { ProjectReadModel } from '../types/models'
import { sanitizeText } from '../utils/sanitizeText'

interface ProjectCardProps {
  project: ProjectReadModel
  canPerformProjectActions?: boolean
  isCurrentMainProject?: boolean
  isProjectFull?: boolean
  isWatched?: boolean
  isTogglingWatch?: boolean
  actionKind?: 'join' | 'switch' | 'leave'
  isSubmittingAction?: boolean
  onProjectAction?: (projectId: string) => void
  onWatchToggle?: (projectId: string) => void
}

export function ProjectCard({
  project,
  canPerformProjectActions = true,
  isCurrentMainProject = false,
  isProjectFull = false,
  isWatched = false,
  isTogglingWatch = false,
  actionKind = 'join',
  isSubmittingAction = false,
  onProjectAction,
  onWatchToggle,
}: ProjectCardProps) {
  const safeTitle = sanitizeText(project.title)
  const safeDescription = sanitizeText(project.description)
  const safeLeadName = sanitizeText(project.leadName)

  const isJoinOrSwitch = actionKind === 'join' || actionKind === 'switch'
  const isDisabled =
    !canPerformProjectActions ||
    isSubmittingAction ||
    (isJoinOrSwitch && (isProjectFull || project.status === 'completed'))
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
      <div className="project-card-header">
        <h3>{safeTitle}</h3>
        <span className={`status-badge status-${project.status}`}>{project.status}</span>
      </div>
      <p className="project-description">{safeDescription}</p>
      <dl className="project-metadata">
        <div>
          <dt>Lead</dt>
          <dd>{safeLeadName}</dd>
        </div>
        <div>
          <dt>Members</dt>
          <dd>{project.memberCount}</dd>
        </div>
      </dl>
      <div className="project-card-actions">
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => onProjectAction?.(project.id)}
        >
          {actionLabel}
        </button>
        <button
          type="button"
          className="button-secondary"
          disabled={!canPerformProjectActions || isTogglingWatch}
          onClick={() => onWatchToggle?.(project.id)}
        >
          {isTogglingWatch ? 'Saving watch...' : isWatched ? 'Unwatch project' : 'Watch project'}
        </button>
      </div>
      {!canPerformProjectActions ? (
        <p role="note" className="helper-text">
          Complete name/email entry to use project actions.
        </p>
      ) : isWatched ? (
        <p role="note" className="helper-text">
          You are watching this project.
        </p>
      ) : isCurrentMainProject ? (
        <p role="note" className="helper-text">
          This is your current main project.
        </p>
      ) : project.status === 'completed' ? (
        <p role="note" className="helper-text">
          Completed projects are read-only for joins.
        </p>
      ) : isProjectFull ? (
        <p role="note" className="helper-text">
          Project is full (max 5 members).
        </p>
      ) : null}
      <Link className="project-details-link" to={`/projects/${project.id}`}>
        View details
      </Link>
    </article>
  )
}
