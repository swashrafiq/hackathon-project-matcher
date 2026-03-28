import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'
import type { ProjectReadModel } from '../types/models'

const sampleProjects: ProjectReadModel[] = [
  {
    id: 'proj-smart-schedule',
    title: 'Smart Schedule Builder',
    description: 'Generate personalized hackathon schedules from tracks and interests.',
    techStack: 'React, TypeScript',
    leadName: 'Nadia Khan',
    memberCount: 3,
    status: 'active',
  },
  {
    id: 'proj-team-finder',
    title: 'Team Finder',
    description: 'Match participants by skills and project interests.',
    techStack: 'Node.js, SQLite',
    leadName: 'Event Coordinator',
    memberCount: 2,
    status: 'active',
  },
]

describe('HomePage', () => {
  it('renders mocked projects as cards with key fields', async () => {
    const loadProjects = async (): Promise<ProjectReadModel[]> => sampleProjects

    render(
      <MemoryRouter>
        <HomePage loadProjects={loadProjects} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Loading projects...')).toBeInTheDocument()
    expect(await screen.findByText('Smart Schedule Builder')).toBeInTheDocument()
    expect(screen.getByText('Team Finder')).toBeInTheDocument()
    expect(screen.getAllByText(/Members:/).length).toBeGreaterThan(0)
  })

  it('renders empty state when loader returns no projects', async () => {
    const loadProjects = async (): Promise<ProjectReadModel[]> => []

    render(
      <MemoryRouter>
        <HomePage loadProjects={loadProjects} />
      </MemoryRouter>,
    )

    expect(await screen.findByText('No projects available yet.')).toBeInTheDocument()
  })

  it('renders fetch error state when project list request fails', async () => {
    const loadProjects = async (): Promise<ProjectReadModel[]> => {
      throw new Error('request failed')
    }

    render(
      <MemoryRouter>
        <HomePage loadProjects={loadProjects} />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Unable to load projects right now.')).toBeInTheDocument()
  })

  it('disables project actions when participant session is missing', async () => {
    const loadProjects = async (): Promise<ProjectReadModel[]> => sampleProjects

    render(
      <MemoryRouter>
        <HomePage loadProjects={loadProjects} canPerformProjectActions={false} />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Enter your name and email above to enable project actions like Join.'),
    ).toBeInTheDocument()
    expect(await screen.findByText('Smart Schedule Builder')).toBeInTheDocument()

    const joinButtons = screen.getAllByRole('button', { name: 'Join project (mocked)' })
    expect(joinButtons.every((button) => button.hasAttribute('disabled'))).toBe(true)
  })
})
