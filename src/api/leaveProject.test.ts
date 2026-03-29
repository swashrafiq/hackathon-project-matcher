import { describe, expect, it, vi } from 'vitest'
import { leaveProject } from './leaveProject'

describe('leave project API client', () => {
  it('submits leave request and returns updated participant payload', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:9000')

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          participant: {
            id: 'user-test',
            name: 'Rafiq',
            email: 'rafiq@example.com',
            role: 'participant',
            mainProjectId: null,
          },
          source: 'left',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const response = await leaveProject('proj-team-finder', 'user-test', 'session-token', fetchMock)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(response.source).toBe('left')
    expect(response.participant.mainProjectId).toBeNull()

    vi.unstubAllEnvs()
  })
})
