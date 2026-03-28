import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from './app'

describe('backend health endpoint', () => {
  afterEach(() => {
    delete process.env.CORS_ORIGINS
    delete process.env.RATE_LIMIT_WINDOW_MS
    delete process.env.RATE_LIMIT_PARTICIPANT_MAX
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

  it('creates participant on first entry and returns existing on repeat', async () => {
    const app = createApp()
    const uniqueEmail = `sam.${Date.now()}@example.com`

    const created = await request(app).post('/participants').send({
      name: 'Sam Jordan',
      email: uniqueEmail,
    })
    expect(created.status).toBe(201)
    expect(created.body.source).toBe('created')
    expect(created.body.participant.role).toBe('participant')

    const existing = await request(app).post('/participants').send({
      name: 'Sam Updated',
      email: uniqueEmail,
    })
    expect(existing.status).toBe(200)
    expect(existing.body.source).toBe('existing')
    expect(existing.body.participant.id).toBe(created.body.participant.id)
    expect(existing.body.participant.name).toBe('Sam Jordan')
  })

  it('rate limits participant entry attempts by client identity', async () => {
    process.env.RATE_LIMIT_PARTICIPANT_MAX = '2'
    process.env.RATE_LIMIT_WINDOW_MS = '60000'
    const app = createApp()

    const base = Date.now()
    const first = await request(app)
      .post('/participants')
      .set('x-forwarded-for', '203.0.113.8')
      .send({
        name: 'Rate One',
        email: `rate.one.${base}@example.com`,
      })
    expect(first.status).toBe(201)

    const second = await request(app)
      .post('/participants')
      .set('x-forwarded-for', '203.0.113.8')
      .send({
        name: 'Rate Two',
        email: `rate.two.${base}@example.com`,
      })
    expect(second.status).toBe(201)

    const third = await request(app)
      .post('/participants')
      .set('x-forwarded-for', '203.0.113.8')
      .send({
        name: 'Rate Three',
        email: `rate.three.${base}@example.com`,
      })

    expect(third.status).toBe(429)
    expect(third.body.error).toBe('Too many participant attempts. Try again soon.')
  })
})
