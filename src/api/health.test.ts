import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchBackendHealth } from './health'

describe('fetchBackendHealth', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('calls the configured backend health endpoint', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:9000')

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'hackathon-project-matcher-api',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    })

    const payload = await fetchBackendHealth(fetchMock)

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:9000/health', {
      headers: { Accept: 'application/json' },
    })
    expect(payload).toEqual({
      status: 'ok',
      service: 'hackathon-project-matcher-api',
    })
  })
})
