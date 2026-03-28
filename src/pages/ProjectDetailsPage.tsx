import { useParams } from 'react-router-dom'
import { sanitizeText } from '../utils/sanitizeText'

export function ProjectDetailsPage() {
  const { projectId } = useParams()
  const safeProjectId = sanitizeText(projectId ?? 'unknown-project')

  return (
    <section>
      <h1>Project Details (Placeholder)</h1>
      <p>This route is the placeholder for detailed project information.</p>
      <p>
        Selected project: <code>{safeProjectId}</code>
      </p>
    </section>
  )
}
