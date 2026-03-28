import { describe, expect, it, vi } from 'vitest'
import { switchProject } from './switchProject'

describe('switch project API client', () => {
  it('submits switch request and returns switched participant payload', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:9000')

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          participant: {
            id: 'user-test',
            name: 'Rafiq',
            email: 'rafiq@example.com',
            role: 'participant',
            mainProjectId: 'proj-team-finder',
          },
          source: 'switched',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const response = await switchProject('proj-team-finder', 'user-test', fetchMock)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(response.source).toBe('switched')
    expect(response.participant.mainProjectId).toBe('proj-team-finder')

    vi.unstubAllEnvs()
  })

  it('surfaces backend full-capacity conflict on switch', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:9000')

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          error: 'Project is full.',
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      )
    })

    await expect(switchProject('proj-team-finder', 'user-test', fetchMock)).rejects.toThrow(
      'Project is full.',
    )

    vi.unstubAllEnvs()
  })
})
