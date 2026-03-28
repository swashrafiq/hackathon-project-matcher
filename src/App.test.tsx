import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
    delete document.documentElement.dataset.theme

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.endsWith('/projects')) {
        return new Response(
          JSON.stringify({
            projects: [
              {
                id: 'proj-smart-schedule',
                title: 'Smart Schedule Builder',
                description:
                  'Generate personalized hackathon schedules from tracks and interests.',
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
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url.endsWith('/projects/proj-smart-schedule')) {
        return new Response(
          JSON.stringify({
            project: {
              id: 'proj-smart-schedule',
              title: 'Smart Schedule Builder',
              description: 'Generate personalized hackathon schedules from tracks and interests.',
              techStack: 'React, TypeScript',
              leadName: 'Nadia Khan',
              memberCount: 3,
              status: 'active',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      return new Response(JSON.stringify({ error: 'Project not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

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

  it('renders project details route from API data', async () => {
    render(
      <MemoryRouter initialEntries={['/projects/proj-smart-schedule']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Smart Schedule Builder' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Tech stack:/)).toBeInTheDocument()
  })

  it('toggles theme and persists selection', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    expect(window.localStorage.getItem('hpm-theme')).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toBeInTheDocument()
  })

  it('falls back to light theme for invalid stored value', () => {
    window.localStorage.setItem('hpm-theme', '<script>')

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    ).toBeInTheDocument()
  })

  it('validates participant email and blocks project actions without session', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Enter your name and email above to enable project actions like Join.'),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Rafiq' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'not-an-email' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enter hackathon' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address.')

    expect(window.localStorage.getItem('hpm-participant-session')).toBeNull()
    expect(await screen.findByText('Smart Schedule Builder')).toBeInTheDocument()
    const joinButtons = screen.getAllByRole('button', { name: 'Join project (mocked)' })
    expect(joinButtons.every((button) => button.hasAttribute('disabled'))).toBe(true)
  })

  it('stores sanitized participant session and enables project actions', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: '  <b>Rafiq</b>  ' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: '  RAFIQ@EXAMPLE.COM  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enter hackathon' }))

    expect(screen.getByText(/Signed in as/i)).toBeInTheDocument()

    const storedSession = window.localStorage.getItem('hpm-participant-session')
    expect(storedSession).toBe(
      JSON.stringify({ name: 'bRafiq/b', email: 'rafiq@example.com' }),
    )

    expect(await screen.findByText('Smart Schedule Builder')).toBeInTheDocument()
    const joinButtons = screen.getAllByRole('button', { name: 'Join project (mocked)' })
    expect(joinButtons.every((button) => !button.hasAttribute('disabled'))).toBe(true)
  })
})
