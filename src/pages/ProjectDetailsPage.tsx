import { useParams } from 'react-router-dom'
import { getMockProjectById } from '../data/mockRepository'
import { sanitizeText } from '../utils/sanitizeText'

export function ProjectDetailsPage() {
  const { projectId } = useParams()
  const safeProjectId = sanitizeText(projectId ?? 'unknown-project')
  const project = getMockProjectById(safeProjectId)

  return (
    <section>
      <h1>Project Details (Placeholder)</h1>
      {project ? (
        <>
          <p>{project.description}</p>
          <p>
            Tech stack: <code>{project.techStack}</code>
          </p>
          <p>
            Lead: <code>{project.leadName}</code> | Members: <code>{project.memberCount}</code>
          </p>
        </>
      ) : (
        <>
          <p>No mock project found for this id yet.</p>
          <p>
            Selected project: <code>{safeProjectId}</code>
          </p>
        </>
      )}
    </section>
  )
}
