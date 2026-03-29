import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { CreateProjectPage } from './CreateProjectPage'

describe('CreateProjectPage', () => {
  it('shows sign-in guidance when participant session is missing', () => {
    render(
      <MemoryRouter>
        <CreateProjectPage canPerformProjectActions={false} />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Enter your name and email above to create a project.'),
    ).toBeInTheDocument()
  })

  it('validates required fields before submission', async () => {
    render(
      <MemoryRouter>
        <CreateProjectPage
          canPerformProjectActions
          participantSession={{
            id: 'user-test',
            name: 'Joiner',
            email: 'joiner@example.com',
            role: 'participant',
            mainProjectId: null,
          }}
          onCreateProject={vi.fn(async () => undefined)}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Create project' }))
    expect(await screen.findByText('All project fields are required.')).toBeInTheDocument()
  })

  it('submits create project and shows success feedback', async () => {
    const onCreateProject = vi.fn(async () => undefined)

    render(
      <MemoryRouter>
        <CreateProjectPage
          canPerformProjectActions
          participantSession={{
            id: 'user-test',
            name: 'Joiner',
            email: 'joiner@example.com',
            role: 'participant',
            mainProjectId: null,
          }}
          onCreateProject={onCreateProject}
        />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Project title'), {
      target: { value: 'My New Project' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Detailed project description for create flow test.' },
    })
    fireEvent.change(screen.getByLabelText('Tech stack'), {
      target: { value: 'React, SQLite' },
    })
    fireEvent.change(screen.getByLabelText('Lead name'), {
      target: { value: 'Rafiq' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }))

    expect(onCreateProject).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Project created successfully.')).toBeInTheDocument()
  })
})
