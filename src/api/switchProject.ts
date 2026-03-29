import { getApiBaseUrl } from '../config/runtimeConfig'
import type { JoinProjectParticipant } from './joinProject'

export interface SwitchProjectResponse {
  participant: JoinProjectParticipant
  source: 'switched' | 'already_joined'
}

interface ErrorResponse {
  error?: string
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export async function switchProject(
  projectId: string,
  participantId: string,
  sessionToken: string,
  fetcher: Fetcher = fetch,
): Promise<SwitchProjectResponse> {
  const response = await fetcher(`${getApiBaseUrl()}/projects/${projectId}/switch`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ participantId }),
  })

  const payload = (await response.json()) as Partial<SwitchProjectResponse & ErrorResponse>
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to switch project right now.')
  }

  if (!payload.participant || !payload.source) {
    throw new Error('Switch project response payload is invalid.')
  }

  return {
    participant: payload.participant,
    source: payload.source,
  }
}
