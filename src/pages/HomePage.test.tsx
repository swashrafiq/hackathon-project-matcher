import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
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
    expect(screen.getAllByText(/^Members$/).length).toBeGreaterThan(0)
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

    const joinButtons = screen.getAllByRole('button', { name: 'Join project' })
    expect(joinButtons.every((button) => button.hasAttribute('disabled'))).toBe(true)
  })

  it('calls join handler and shows success message', async () => {
    const loadProjects = async (): Promise<ProjectReadModel[]> => sampleProjects
    const onJoinProject = vi.fn(async () => 'joined' as const)

    render(
      <MemoryRouter>
        <HomePage
          loadProjects={loadProjects}
          canPerformProjectActions
          participantSession={{
            id: 'user-test',
            name: 'Joiner',
            email: 'joiner@example.com',
            role: 'participant',
            mainProjectId: null,
          }}
          onJoinProject={onJoinProject}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Smart Schedule Builder')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Join project' })[0])

    expect(onJoinProject).toHaveBeenCalledWith('proj-smart-schedule')
    expect(await screen.findByText('Project joined successfully.')).toBeInTheDocument()
  })

  it('shows disabled Join button and helper note when project is full', async () => {
    const loadProjects = async (): Promise<ProjectReadModel[]> => [
      {
        ...sampleProjects[0],
        memberCount: 5,
      },
    ]

    render(
      <MemoryRouter>
        <HomePage
          loadProjects={loadProjects}
          canPerformProjectActions
          participantSession={{
            id: 'user-test',
            name: 'Joiner',
            email: 'joiner@example.com',
            role: 'participant',
            mainProjectId: null,
          }}
          onJoinProject={vi.fn(async () => 'joined' as const)}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Smart Schedule Builder')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Join project' })).toBeDisabled()
    expect(screen.getByText('Project is full (max 5 members).')).toBeInTheDocument()
  })

  it('calls leave handler for current main project', async () => {
    const loadProjects = async (): Promise<ProjectReadModel[]> => sampleProjects
    const onLeaveProject = vi.fn(async () => 'left' as const)

    render(
      <MemoryRouter>
        <HomePage
          loadProjects={loadProjects}
          canPerformProjectActions
          participantSession={{
            id: 'user-test',
            name: 'Joiner',
            email: 'joiner@example.com',
            role: 'participant',
            mainProjectId: 'proj-smart-schedule',
          }}
          onLeaveProject={onLeaveProject}
          onSwitchProject={vi.fn(async () => 'switched' as const)}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Smart Schedule Builder')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Give up current project' }))

    expect(onLeaveProject).toHaveBeenCalledWith('proj-smart-schedule')
    expect(await screen.findByText('You left your current main project.')).toBeInTheDocument()
  })

  it('calls switch handler for non-main project and shows success', async () => {
    const loadProjects = async (): Promise<ProjectReadModel[]> => sampleProjects
    const onSwitchProject = vi.fn(async () => 'switched' as const)

    render(
      <MemoryRouter>
        <HomePage
          loadProjects={loadProjects}
          canPerformProjectActions
          participantSession={{
            id: 'user-test',
            name: 'Joiner',
            email: 'joiner@example.com',
            role: 'participant',
            mainProjectId: 'proj-smart-schedule',
          }}
          onLeaveProject={vi.fn(async () => 'left' as const)}
          onSwitchProject={onSwitchProject}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Smart Schedule Builder')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to this project' }))

    expect(onSwitchProject).toHaveBeenCalledWith('proj-team-finder')
    expect(await screen.findByText('Main project switched successfully.')).toBeInTheDocument()
  })

  it('shows switch/join error returned by backend workflow', async () => {
    const loadProjects = async (): Promise<ProjectReadModel[]> => sampleProjects
    const onSwitchProject = vi.fn(async () => {
      throw new Error('Project is full.')
    })

    render(
      <MemoryRouter>
        <HomePage
          loadProjects={loadProjects}
          canPerformProjectActions
          participantSession={{
            id: 'user-test',
            name: 'Joiner',
            email: 'joiner@example.com',
            role: 'participant',
            mainProjectId: 'proj-smart-schedule',
          }}
          onLeaveProject={vi.fn(async () => 'left' as const)}
          onSwitchProject={onSwitchProject}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Smart Schedule Builder')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to this project' }))

    expect(await screen.findByText('Project is full.')).toBeInTheDocument()
  })

  it('toggles watch and shows watch feedback', async () => {
    const loadProjects = async (): Promise<ProjectReadModel[]> => sampleProjects
    const onToggleWatch = vi.fn(async () => undefined)

    render(
      <MemoryRouter>
        <HomePage
          loadProjects={loadProjects}
          canPerformProjectActions
          participantSession={{
            id: 'user-test',
            name: 'Joiner',
            email: 'joiner@example.com',
            role: 'participant',
            mainProjectId: null,
          }}
          watchedProjectIds={[]}
          onToggleWatch={onToggleWatch}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Smart Schedule Builder')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Watch project' })[0])

    expect(onToggleWatch).toHaveBeenCalledWith('proj-smart-schedule')
    expect(await screen.findByText('Project added to watchlist.')).toBeInTheDocument()
  })

})
