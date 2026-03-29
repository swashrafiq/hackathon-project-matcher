import { describe, expect, it, vi } from 'vitest'
import { createProjectByParticipant } from './createProject'

describe('create project API client', () => {
  it('creates a project and returns updated participant payload', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:9000')

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          project: {
            id: 'proj-new-123',
            title: 'New Idea',
            description: 'A longer project description for tests.',
            techStack: 'React, SQLite',
            leadName: 'Rafiq',
            memberCount: 1,
            status: 'active',
          },
          participant: {
            id: 'user-test',
            name: 'Rafiq',
            email: 'rafiq@example.com',
            role: 'participant',
            mainProjectId: 'proj-new-123',
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const response = await createProjectByParticipant(
      'user-test',
      {
        title: 'New Idea',
        description: 'A longer project description for tests.',
        techStack: 'React, SQLite',
        leadName: 'Rafiq',
      },
      fetchMock,
    )

    expect(response.project.id).toBe('proj-new-123')
    expect(response.participant.mainProjectId).toBe('proj-new-123')

    vi.unstubAllEnvs()
  })
})
