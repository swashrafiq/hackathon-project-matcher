import { describe, expect, it, vi } from 'vitest'
import { submitParticipantEntry } from './participants'

describe('participants API client', () => {
  it('submits participant entry and returns created participant payload', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:9000')

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          participant: {
            id: 'user-test-1',
            name: 'Rafiq',
            email: 'rafiq@example.com',
            role: 'participant',
            mainProjectId: null,
          },
          source: 'created',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const response = await submitParticipantEntry('Rafiq', 'rafiq@example.com', fetchMock)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(response.source).toBe('created')
    expect(response.participant.role).toBe('participant')

    vi.unstubAllEnvs()
  })
})
