import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ProjectDetailsPage } from './ProjectDetailsPage'
import type { ProjectReadModel } from '../types/models'

const sampleProject: ProjectReadModel = {
  id: 'proj-smart-schedule',
  title: 'Smart Schedule Builder',
  description: 'Generate personalized hackathon schedules from tracks and interests.',
  techStack: 'React, TypeScript',
  leadName: 'Nadia Khan',
  memberCount: 3,
  status: 'active',
}

function renderDetailsRoute(
  initialPath: string,
  loadProjectById?: (projectId: string) => Promise<ProjectReadModel | null>,
  options?: {
    canPerformProjectActions?: boolean
    watchedProjectIds?: string[]
    onToggleWatch?: (projectId: string) => Promise<void>
  },
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/projects/:projectId"
          element={
            <ProjectDetailsPage
              loadProjectById={loadProjectById}
              canPerformProjectActions={options?.canPerformProjectActions}
              watchedProjectIds={options?.watchedProjectIds}
              onToggleWatch={options?.onToggleWatch}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProjectDetailsPage', () => {
  it('renders full details for a valid project id from API loader', async () => {
    const loadProjectById = async (): Promise<ProjectReadModel> => sampleProject

    renderDetailsRoute('/projects/proj-smart-schedule', loadProjectById)

    expect(
      await screen.findByRole('heading', { name: 'Smart Schedule Builder' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Tech stack')).toBeInTheDocument()
    expect(screen.getByText('Lead')).toBeInTheDocument()
    expect(screen.getByText('Members')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('renders safe not-found state for invalid ids', async () => {
    renderDetailsRoute('/projects/<script>')

    expect(
      await screen.findByRole('heading', { name: 'Project Not Found' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'No project exists for this id.',
    )
    expect(screen.getByText(/Requested id:/)).toBeInTheDocument()
  })

  it('renders request error state when API loader fails', async () => {
    const loadProjectById = async (): Promise<ProjectReadModel | null> => {
      throw new Error('request failed')
    }

    renderDetailsRoute('/projects/proj-smart-schedule', loadProjectById)

    expect(
      await screen.findByText('Unable to load project details right now.'),
    ).toBeInTheDocument()
  })

  it('shows watch toggle and calls handler in details view', async () => {
    const loadProjectById = async (): Promise<ProjectReadModel> => sampleProject
    const onToggleWatch = vi.fn(async () => undefined)

    renderDetailsRoute('/projects/proj-smart-schedule', loadProjectById, {
      canPerformProjectActions: true,
      watchedProjectIds: [],
      onToggleWatch,
    })

    expect(
      await screen.findByRole('heading', { name: 'Smart Schedule Builder' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Watch project' }))

    expect(onToggleWatch).toHaveBeenCalledWith('proj-smart-schedule')
    expect(await screen.findByText('Project added to watchlist.')).toBeInTheDocument()
  })
})
