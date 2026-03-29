import { getApiBaseUrl } from '../config/runtimeConfig'

export interface ParticipantApiModel {
  id: string
  name: string
  email: string
  role: 'participant' | 'admin'
  mainProjectId: string | null
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

interface ParticipantResponse {
  participant: ParticipantApiModel
  source?: 'created' | 'existing'
  sessionToken: string
}

interface ErrorResponse {
  error?: string
}

export async function submitParticipantEntry(
  name: string,
  email: string,
  fetcher: Fetcher = fetch,
): Promise<ParticipantResponse> {
  const response = await fetcher(`${getApiBaseUrl()}/participants`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email }),
  })

  const payload = (await response.json()) as Partial<ParticipantResponse & ErrorResponse>
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to submit participant entry.')
  }

  if (!payload.participant || typeof payload.sessionToken !== 'string' || payload.sessionToken.length === 0) {
    throw new Error('Participant response payload is invalid.')
  }

  return {
    participant: payload.participant,
    source: payload.source || 'existing',
    sessionToken: payload.sessionToken,
  }
}
