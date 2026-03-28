import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'
import type { Project } from '../types/models'

describe('HomePage', () => {
  it('renders mocked projects as cards with key fields', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Loading projects...')).toBeInTheDocument()
    expect(await screen.findByText('Smart Schedule Builder')).toBeInTheDocument()
    expect(screen.getByText('Team Finder')).toBeInTheDocument()
    expect(screen.getAllByText(/Members:/).length).toBeGreaterThan(0)
  })

  it('renders empty state when loader returns no projects', async () => {
    const loadProjects = (): Project[] => []

    render(
      <MemoryRouter>
        <HomePage loadProjects={loadProjects} />
      </MemoryRouter>,
    )

    expect(await screen.findByText('No projects available yet.')).toBeInTheDocument()
  })
})
