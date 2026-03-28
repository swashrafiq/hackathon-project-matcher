import { getApiBaseUrl } from '../config/runtimeConfig'

interface HealthResponse {
  status: string
  service: string
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export async function fetchBackendHealth(
  fetcher: Fetcher = fetch,
): Promise<HealthResponse> {
  const response = await fetcher(`${getApiBaseUrl()}/health`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }

  const payload = (await response.json()) as Partial<HealthResponse>
  if (payload.status !== 'ok' || typeof payload.service !== 'string') {
    throw new Error('Health response payload is invalid')
  }

  return {
    status: payload.status,
    service: payload.service,
  }
}
