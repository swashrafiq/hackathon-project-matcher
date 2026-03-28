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
})
