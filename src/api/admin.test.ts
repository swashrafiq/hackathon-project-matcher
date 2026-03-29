import { describe, expect, it, vi } from 'vitest'
import { completeProjectAsAdmin } from './admin'

describe('admin API client', () => {
  it('marks project completed', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:9000')

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          project: {
            id: 'proj-smart-schedule',
            title: 'Smart Schedule Builder',
            description: 'Generate personalized schedules.',
            techStack: 'React',
            leadName: 'Nadia',
            memberCount: 3,
            status: 'completed',
          },
          source: 'completed',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const response = await completeProjectAsAdmin(
      'proj-smart-schedule',
      'admin-coordinator',
      'session-token',
      fetchMock,
    )
    expect(response.project.status).toBe('completed')
    expect(response.source).toBe('completed')

    vi.unstubAllEnvs()
  })
})
