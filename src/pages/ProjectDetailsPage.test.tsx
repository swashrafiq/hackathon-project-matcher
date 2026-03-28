import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProjectDetailsPage } from './ProjectDetailsPage'

function renderDetailsRoute(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProjectDetailsPage', () => {
  it('renders full details for a valid mocked project id', () => {
    renderDetailsRoute('/projects/proj-smart-schedule')

    expect(
      screen.getByRole('heading', { name: 'Smart Schedule Builder' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Tech stack:/)).toBeInTheDocument()
    expect(screen.getByText(/Lead:/)).toBeInTheDocument()
    expect(screen.getByText(/Members:/)).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('renders safe not-found state for invalid ids', () => {
    renderDetailsRoute('/projects/<script>')

    expect(
      screen.getByRole('heading', { name: 'Project Not Found' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'No mock project exists for this id.',
    )
    expect(screen.getByText(/Requested id:/)).toBeInTheDocument()
  })
})
