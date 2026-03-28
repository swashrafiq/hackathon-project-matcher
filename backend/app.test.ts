import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from './app'

describe('backend health endpoint', () => {
  afterEach(() => {
    delete process.env.CORS_ORIGINS
  })

  it('returns API health payload', async () => {
    const app = createApp()

    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ok',
      service: 'hackathon-project-matcher-api',
    })
  })

  it('sets security headers and allows configured frontend origin', async () => {
    process.env.CORS_ORIGINS = 'http://localhost:5173'
    const app = createApp()

    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173')

    expect(response.status).toBe(200)
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })
})
