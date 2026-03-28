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

  it('returns sanitized project list read model fields only', async () => {
    const app = createApp()
    const response = await request(app).get('/projects')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body.projects)).toBe(true)
    expect(response.body.projects.length).toBeGreaterThan(0)

    const firstProject = response.body.projects[0] as Record<string, unknown>
    expect(firstProject).toHaveProperty('id')
    expect(firstProject).toHaveProperty('title')
    expect(firstProject).not.toHaveProperty('createdByUserId')
    expect(firstProject).not.toHaveProperty('memberIds')
  })

  it('returns one project by id with 404 for missing projects', async () => {
    const app = createApp()

    const found = await request(app).get('/projects/proj-smart-schedule')
    expect(found.status).toBe(200)
    expect(found.body.project.id).toBe('proj-smart-schedule')

    const notFound = await request(app).get('/projects/proj-unknown')
    expect(notFound.status).toBe(404)
    expect(notFound.body.error).toBe('Project not found.')
  })

  it('rejects invalid project id format', async () => {
    const app = createApp()
    const response = await request(app).get('/projects/%3Cscript%3E')

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('Invalid project id format.')
  })
})
