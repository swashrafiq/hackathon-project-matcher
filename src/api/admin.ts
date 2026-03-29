import { getApiBaseUrl } from '../config/runtimeConfig'
import type { ProjectReadModel } from '../types/models'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

interface CompleteProjectResponse {
  project: ProjectReadModel
  source: 'completed'
}

interface ErrorResponse {
  error?: string
}

export async function completeProjectAsAdmin(
  projectId: string,
  participantId: string,
  fetcher: Fetcher = fetch,
): Promise<CompleteProjectResponse> {
  const response = await fetcher(`${getApiBaseUrl()}/projects/${projectId}/complete`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ participantId }),
  })

  const payload = (await response.json()) as Partial<CompleteProjectResponse & ErrorResponse>
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to complete project right now.')
  }

  if (!payload.project || payload.source !== 'completed') {
    throw new Error('Complete project response payload is invalid.')
  }

  return {
    project: payload.project,
    source: payload.source,
  }
}
