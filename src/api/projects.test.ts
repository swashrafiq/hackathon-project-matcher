import { describe, expect, it, vi } from 'vitest'
import { fetchProjectById, fetchProjects } from './projects'

describe('projects API client', () => {
  it('fetches project list from configured backend base url', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:9000')

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          projects: [
            {
              id: 'proj-smart-schedule',
              title: 'Smart Schedule Builder',
              description: 'Generate personalized hackathon schedules from tracks and interests.',
              techStack: 'React, TypeScript',
              leadName: 'Nadia Khan',
              memberCount: 3,
              status: 'active',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const projects = await fetchProjects(fetchMock)

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:9000/projects', {
      headers: { Accept: 'application/json' },
    })
    expect(projects).toHaveLength(1)
    vi.unstubAllEnvs()
  })

  it('returns null on 404 for project details endpoint', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ error: 'Project not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const project = await fetchProjectById('proj-unknown', fetchMock)
    expect(project).toBeNull()
  })
})
