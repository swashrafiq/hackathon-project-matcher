import { getApiBaseUrl } from '../config/runtimeConfig'

export interface JoinProjectParticipant {
  id: string
  name: string
  email: string
  role: 'participant' | 'admin'
  mainProjectId: string | null
}

export interface JoinProjectResponse {
  participant: JoinProjectParticipant
  source: 'joined' | 'already_joined'
}

interface ErrorResponse {
  error?: string
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export async function joinProject(
  projectId: string,
  participantId: string,
  sessionToken: string,
  fetcher: Fetcher = fetch,
): Promise<JoinProjectResponse> {
  const response = await fetcher(`${getApiBaseUrl()}/projects/${projectId}/join`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ participantId }),
  })

  const payload = (await response.json()) as Partial<JoinProjectResponse & ErrorResponse>
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to join project right now.')
  }

  if (!payload.participant || !payload.source) {
    throw new Error('Join project response payload is invalid.')
  }

  return {
    participant: payload.participant,
    source: payload.source,
  }
}
