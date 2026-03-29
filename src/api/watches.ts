import { getApiBaseUrl } from '../config/runtimeConfig'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

interface WatchesResponse {
  watchedProjectIds: string[]
}

interface ToggleWatchResponse extends WatchesResponse {
  source: 'watched' | 'unwatched'
}

interface ErrorResponse {
  error?: string
}

function ensureIds(payload: Partial<WatchesResponse>): string[] {
  return Array.isArray(payload.watchedProjectIds) ? payload.watchedProjectIds : []
}

export async function fetchWatchedProjectIds(
  participantId: string,
  fetcher: Fetcher = fetch,
): Promise<string[]> {
  const response = await fetcher(`${getApiBaseUrl()}/participants/${participantId}/watches`, {
    headers: { Accept: 'application/json' },
  })

  const payload = (await response.json()) as Partial<WatchesResponse & ErrorResponse>
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load watched projects right now.')
  }

  return ensureIds(payload)
}

export async function watchProjectByParticipant(
  participantId: string,
  projectId: string,
  fetcher: Fetcher = fetch,
): Promise<string[]> {
  const response = await fetcher(
    `${getApiBaseUrl()}/participants/${participantId}/watches/${projectId}`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  const payload = (await response.json()) as Partial<ToggleWatchResponse & ErrorResponse>
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to watch project right now.')
  }

  return ensureIds(payload)
}

export async function unwatchProjectByParticipant(
  participantId: string,
  projectId: string,
  fetcher: Fetcher = fetch,
): Promise<string[]> {
  const response = await fetcher(
    `${getApiBaseUrl()}/participants/${participantId}/watches/${projectId}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  const payload = (await response.json()) as Partial<ToggleWatchResponse & ErrorResponse>
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to unwatch project right now.')
  }

  return ensureIds(payload)
}
