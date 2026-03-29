import { type FormEvent, useState } from 'react'
import type { ParticipantSession } from '../utils/participantSession'
import { sanitizeText } from '../utils/sanitizeText'

interface CreateProjectPageProps {
  canPerformProjectActions?: boolean
  participantSession?: ParticipantSession | null
  onCreateProject?: (input: {
    title: string
    description: string
    techStack: string
    leadName: string
  }) => Promise<void>
}

export function CreateProjectPage({
  canPerformProjectActions = false,
  participantSession = null,
  onCreateProject,
}: CreateProjectPageProps) {
  const [createTitle, setCreateTitle] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createTechStack, setCreateTechStack] = useState('')
  const [createLeadName, setCreateLeadName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [createMessage, setCreateMessage] = useState<string | null>(null)
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!participantSession || !onCreateProject) {
      setCreateError('Please enter your name and email first.')
      return
    }

    const payload = {
      title: sanitizeText(createTitle),
      description: sanitizeText(createDescription),
      techStack: sanitizeText(createTechStack),
      leadName: sanitizeText(createLeadName),
    }

    if (!payload.title || !payload.description || !payload.techStack || !payload.leadName) {
      setCreateError('All project fields are required.')
      return
    }

    setCreateError(null)
    setCreateMessage(null)
    setIsCreatingProject(true)
    try {
      await onCreateProject(payload)
      setCreateTitle('')
      setCreateDescription('')
      setCreateTechStack('')
      setCreateLeadName('')
      setCreateMessage('Project created successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create project right now.'
      setCreateError(message)
    } finally {
      setIsCreatingProject(false)
    }
  }

  return (
    <section className="page-stack" aria-label="Create project page">
      <header className="page-hero">
        <h1>Create a new project</h1>
        <p className="hero-subtitle">
          Share a concise pitch so participants can quickly understand and join your idea.
        </p>
      </header>
      {!canPerformProjectActions ? (
        <p role="status" className="status-message">
          Enter your name and email above to create a project.
        </p>
      ) : null}
      <section className="surface-panel" aria-label="Create project form">
        <h2>Project details</h2>
        <form className="create-project-form" onSubmit={handleCreateProject} noValidate>
          <div className="entry-field-group">
            <label htmlFor="create-title">Project title</label>
            <input
              id="create-title"
              value={createTitle}
              onChange={(event) => setCreateTitle(event.target.value)}
              required
            />
          </div>
          <div className="entry-field-group">
            <label htmlFor="create-description">Description</label>
            <textarea
              id="create-description"
              value={createDescription}
              onChange={(event) => setCreateDescription(event.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="create-form-row">
            <div className="entry-field-group">
              <label htmlFor="create-tech-stack">Tech stack</label>
              <input
                id="create-tech-stack"
                value={createTechStack}
                onChange={(event) => setCreateTechStack(event.target.value)}
                required
              />
            </div>
            <div className="entry-field-group">
              <label htmlFor="create-lead-name">Lead name</label>
              <input
                id="create-lead-name"
                value={createLeadName}
                onChange={(event) => setCreateLeadName(event.target.value)}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isCreatingProject || Boolean(participantSession?.mainProjectId)}
          >
            {isCreatingProject ? 'Creating...' : 'Create project'}
          </button>
          {participantSession?.mainProjectId ? (
            <p role="note" className="helper-text">
              Leave or switch your current main project before creating a new one.
            </p>
          ) : null}
          {createMessage ? (
            <p role="status" className="status-message">
              {createMessage}
            </p>
          ) : null}
          {createError ? (
            <p role="alert" className="entry-error-text">
              {createError}
            </p>
          ) : null}
        </form>
      </section>
    </section>
  )
}
