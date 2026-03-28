import { describe, expect, it, vi } from 'vitest'
import { joinProject } from './joinProject'

describe('join project API client', () => {
  it('submits join request and returns participant payload', async () => {
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
          source: 'joined',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const response = await joinProject('proj-team-finder', 'user-test', fetchMock)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(response.source).toBe('joined')
    expect(response.participant.mainProjectId).toBe('proj-team-finder')

    vi.unstubAllEnvs()
  })

  it('surfaces backend conflict message when already in another main project', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:9000')

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          error: 'You already have a main project. Leave or switch before joining another.',
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      )
    })

    await expect(joinProject('proj-team-finder', 'user-test', fetchMock)).rejects.toThrow(
      'You already have a main project. Leave or switch before joining another.',
    )

    vi.unstubAllEnvs()
  })
})
