import { useParams } from 'react-router-dom'
import { getMockProjectById } from '../data/mockRepository'
import { sanitizeText } from '../utils/sanitizeText'

export function ProjectDetailsPage() {
  const { projectId } = useParams()
  const safeProjectId = sanitizeText(projectId ?? 'unknown-project')
  const project = getMockProjectById(safeProjectId)

  if (!project) {
    return (
      <section>
        <h1>Project Not Found</h1>
        <p role="status">No mock project exists for this id.</p>
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
