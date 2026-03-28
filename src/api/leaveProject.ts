import { getApiBaseUrl } from '../config/runtimeConfig'
import type { JoinProjectParticipant } from './joinProject'

export interface LeaveProjectResponse {
  participant: JoinProjectParticipant
  source: 'left'
}

interface ErrorResponse {
  error?: string
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export async function leaveProject(
  projectId: string,
  participantId: string,
  fetcher: Fetcher = fetch,
): Promise<LeaveProjectResponse> {
  const response = await fetcher(`${getApiBaseUrl()}/projects/${projectId}/leave`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ participantId }),
  })

  const payload = (await response.json()) as Partial<LeaveProjectResponse & ErrorResponse>
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to leave project right now.')
  }

  if (!payload.participant || payload.source !== 'left') {
    throw new Error('Leave project response payload is invalid.')
  }

  return {
    participant: payload.participant,
    source: payload.source,
  }
}
