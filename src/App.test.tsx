import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
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

  it('renders project details placeholder route', () => {
    render(
      <MemoryRouter initialEntries={['/projects/proj-smart-schedule']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Smart Schedule Builder' }),
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
