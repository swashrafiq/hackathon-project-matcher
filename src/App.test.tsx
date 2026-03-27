import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders hello message', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Hello Hackathon Project Matcher' }),
    ).toBeInTheDocument()
  })
})
