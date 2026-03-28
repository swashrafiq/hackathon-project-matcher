import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders app shell and home route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: 'Hackathon Project Matcher' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Hello Hackathon Project Matcher' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Single-event prototype for fast team coordination.'),
    ).toBeInTheDocument()
  })

  it('renders project details placeholder route', () => {
    render(
      <MemoryRouter initialEntries={['/projects/sample-project']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Project Details (Placeholder)' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Selected project:/)).toBeInTheDocument()
  })
})
