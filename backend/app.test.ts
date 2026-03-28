import { rmSync } from 'node:fs'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from './app'
import { getDatabasePath } from './db/config'

describe('backend health endpoint', () => {
  async function createParticipantForTest(app: ReturnType<typeof createApp>, label: string) {
    const created = await request(app).post('/participants').send({
      name: `Test ${label}`,
      email: `test.${label}.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`,
    })

    expect(created.status).toBe(201)
    return created.body.participant.id as string
  }

  afterEach(() => {
    delete process.env.CORS_ORIGINS
    delete process.env.RATE_LIMIT_WINDOW_MS
    delete process.env.RATE_LIMIT_PARTICIPANT_MAX
    rmSync(getDatabasePath(), { force: true })
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

  it('joins a project and updates participant main project id', async () => {
    const app = createApp()
    const uniqueEmail = `join.${Date.now()}@example.com`

    const created = await request(app).post('/participants').send({
      name: 'Join Ready',
      email: uniqueEmail,
    })
    expect(created.status).toBe(201)

    const participantId = created.body.participant.id as string
    const joinResponse = await request(app).post('/projects/proj-team-finder/join').send({
      participantId,
    })

    expect(joinResponse.status).toBe(200)
    expect(joinResponse.body.source).toBe('joined')
    expect(joinResponse.body.participant.mainProjectId).toBe('proj-team-finder')

    const projectAfterJoin = await request(app).get('/projects/proj-team-finder')
    expect(projectAfterJoin.status).toBe(200)
    expect(projectAfterJoin.body.project.memberCount).toBe(3)
  })

  it('rejects joining another project when participant already has main project', async () => {
    const app = createApp()

    const response = await request(app).post('/projects/proj-team-finder/join').send({
      participantId: 'user-smart-schedule-lead',
    })

    expect(response.status).toBe(409)
    expect(response.body.error).toBe(
      'You already have a main project. Leave or switch before joining another.',
    )
  })

  it('enforces project capacity with boundary behavior (4->5 allowed, 5->6 blocked)', async () => {
    const app = createApp()

    const first = await createParticipantForTest(app, 'capacity-one')
    const second = await createParticipantForTest(app, 'capacity-two')
    const third = await createParticipantForTest(app, 'capacity-three')
    const fourth = await createParticipantForTest(app, 'capacity-four')

    expect(
      (await request(app).post('/projects/proj-team-finder/join').send({ participantId: first }))
        .status,
    ).toBe(200)
    expect(
      (await request(app).post('/projects/proj-team-finder/join').send({ participantId: second }))
        .status,
    ).toBe(200)
    expect(
      (await request(app).post('/projects/proj-team-finder/join').send({ participantId: third }))
        .status,
    ).toBe(200)

    const blocked = await request(app).post('/projects/proj-team-finder/join').send({
      participantId: fourth,
    })

    expect(blocked.status).toBe(409)
    expect(blocked.body.error).toBe('Project is full.')

    const projectAfterAttempts = await request(app).get('/projects/proj-team-finder')
    expect(projectAfterAttempts.status).toBe(200)
    expect(projectAfterAttempts.body.project.memberCount).toBe(5)
  })

  it('leaves current main project and decrements member count', async () => {
    const app = createApp()
    const participantId = await createParticipantForTest(app, 'leave-flow')

    const join = await request(app).post('/projects/proj-team-finder/join').send({ participantId })
    expect(join.status).toBe(200)

    const leave = await request(app).post('/projects/proj-team-finder/leave').send({ participantId })
    expect(leave.status).toBe(200)
    expect(leave.body.source).toBe('left')
    expect(leave.body.participant.mainProjectId).toBeNull()

    const projectAfterLeave = await request(app).get('/projects/proj-team-finder')
    expect(projectAfterLeave.status).toBe(200)
    expect(projectAfterLeave.body.project.memberCount).toBe(2)
  })

  it('rejects leaving a project that is not participant main project', async () => {
    const app = createApp()
    const participantId = await createParticipantForTest(app, 'leave-not-owned')

    const leave = await request(app).post('/projects/proj-team-finder/leave').send({ participantId })
    expect(leave.status).toBe(409)
    expect(leave.body.error).toBe('You can only leave your current main project.')
  })

  it('switches main project and updates both project counts', async () => {
    const app = createApp()
    const participantId = await createParticipantForTest(app, 'switch-success')

    const join = await request(app).post('/projects/proj-team-finder/join').send({ participantId })
    expect(join.status).toBe(200)

    const switchResponse = await request(app)
      .post('/projects/proj-smart-schedule/switch')
      .send({ participantId })
    expect(switchResponse.status).toBe(200)
    expect(switchResponse.body.source).toBe('switched')
    expect(switchResponse.body.participant.mainProjectId).toBe('proj-smart-schedule')

    const teamFinder = await request(app).get('/projects/proj-team-finder')
    const smartSchedule = await request(app).get('/projects/proj-smart-schedule')
    expect(teamFinder.status).toBe(200)
    expect(smartSchedule.status).toBe(200)
    expect(teamFinder.body.project.memberCount).toBe(2)
    expect(smartSchedule.body.project.memberCount).toBe(4)
  })

  it('rolls back switch when target project is full', async () => {
    const app = createApp()

    const fillerOne = await createParticipantForTest(app, 'switch-full-one')
    const fillerTwo = await createParticipantForTest(app, 'switch-full-two')
    const switcher = await createParticipantForTest(app, 'switch-full-switcher')

    expect(
      (await request(app).post('/projects/proj-team-finder/join').send({ participantId: switcher }))
        .status,
    ).toBe(200)
    expect(
      (await request(app).post('/projects/proj-smart-schedule/join').send({ participantId: fillerOne }))
        .status,
    ).toBe(200)
    expect(
      (await request(app).post('/projects/proj-smart-schedule/join').send({ participantId: fillerTwo }))
        .status,
    ).toBe(200)

    const blockedSwitch = await request(app)
      .post('/projects/proj-smart-schedule/switch')
      .send({ participantId: switcher })
    expect(blockedSwitch.status).toBe(409)
    expect(blockedSwitch.body.error).toBe('Project is full.')

    const teamFinder = await request(app).get('/projects/proj-team-finder')
    const smartSchedule = await request(app).get('/projects/proj-smart-schedule')
    expect(teamFinder.status).toBe(200)
    expect(smartSchedule.status).toBe(200)
    expect(teamFinder.body.project.memberCount).toBe(3)
    expect(smartSchedule.body.project.memberCount).toBe(5)

    const leaveStillMain = await request(app)
      .post('/projects/proj-team-finder/leave')
      .send({ participantId: switcher })
    expect(leaveStillMain.status).toBe(200)
    expect(leaveStillMain.body.source).toBe('left')
  })
})
