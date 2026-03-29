import { rmSync } from 'node:fs'
import { join } from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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

  beforeEach(() => {
    process.env.DATABASE_PATH = join(
      process.cwd(),
      'backend',
      'data',
      `test-app-${Date.now()}-${Math.floor(Math.random() * 10000)}.sqlite`,
    )
  })

  afterEach(() => {
    const databasePath = getDatabasePath()
    delete process.env.CORS_ORIGINS
    delete process.env.RATE_LIMIT_WINDOW_MS
    delete process.env.RATE_LIMIT_PARTICIPANT_MAX
    delete process.env.DATABASE_PATH
    rmSync(databasePath, { force: true })
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

  it('allows watching multiple projects while keeping one main project', async () => {
    const app = createApp()
    const participantId = await createParticipantForTest(app, 'watch-multi')

    const join = await request(app).post('/projects/proj-team-finder/join').send({ participantId })
    expect(join.status).toBe(200)

    const watchOne = await request(app).post(
      `/participants/${participantId}/watches/proj-team-finder`,
    )
    const watchTwo = await request(app).post(
      `/participants/${participantId}/watches/proj-smart-schedule`,
    )

    expect(watchOne.status).toBe(200)
    expect(watchTwo.status).toBe(200)
    expect(watchTwo.body.watchedProjectIds).toEqual([
      'proj-smart-schedule',
      'proj-team-finder',
    ])

    // Watching should remain independent from single-main-project constraint.
    const blockedSecondMain = await request(app)
      .post('/projects/proj-smart-schedule/join')
      .send({ participantId })
    expect(blockedSecondMain.status).toBe(409)
    expect(blockedSecondMain.body.error).toBe(
      'You already have a main project. Leave or switch before joining another.',
    )
  })

  it('watches and unwatches only within participant scoped route', async () => {
    const app = createApp()
    const participantId = await createParticipantForTest(app, 'watch-scope')
    const otherParticipantId = await createParticipantForTest(app, 'watch-other')

    const watch = await request(app).post(
      `/participants/${participantId}/watches/proj-smart-schedule`,
    )
    expect(watch.status).toBe(200)
    expect(watch.body.source).toBe('watched')

    const listAfterWatch = await request(app).get(`/participants/${participantId}/watches`)
    expect(listAfterWatch.status).toBe(200)
    expect(listAfterWatch.body.watchedProjectIds).toContain('proj-smart-schedule')

    const otherUserUnwatch = await request(app).delete(
      `/participants/${otherParticipantId}/watches/proj-smart-schedule`,
    )
    expect(otherUserUnwatch.status).toBe(200)

    const listAfterOtherUnwatch = await request(app).get(`/participants/${participantId}/watches`)
    expect(listAfterOtherUnwatch.status).toBe(200)
    expect(listAfterOtherUnwatch.body.watchedProjectIds).toContain('proj-smart-schedule')

    const unwatch = await request(app).delete(
      `/participants/${participantId}/watches/proj-smart-schedule`,
    )
    expect(unwatch.status).toBe(200)
    expect(unwatch.body.source).toBe('unwatched')
    expect(unwatch.body.watchedProjectIds).not.toContain('proj-smart-schedule')
  })

  it('creates project with creator auto-assigned as main project member', async () => {
    const app = createApp()
    const participantId = await createParticipantForTest(app, 'create-project')

    const createResponse = await request(app).post('/projects').send({
      participantId,
      title: 'Realtime Pairing Assistant',
      description: 'Helps teams match quickly using skills and interest tags.',
      techStack: 'React, Node.js, SQLite',
      leadName: 'Rafiq',
    })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.project.title).toBe('Realtime Pairing Assistant')
    expect(createResponse.body.project.memberCount).toBe(1)
    expect(createResponse.body.participant.mainProjectId).toBe(createResponse.body.project.id)
  })

  it('blocks creating a new project when participant already has a main project', async () => {
    const app = createApp()
    const participantId = await createParticipantForTest(app, 'create-project-blocked')

    expect(
      (await request(app).post('/projects/proj-team-finder/join').send({ participantId })).status,
    ).toBe(200)

    const createResponse = await request(app).post('/projects').send({
      participantId,
      title: 'Another Project',
      description: 'This should be blocked because main project already exists.',
      techStack: 'TypeScript',
      leadName: 'Blocked User',
    })

    expect(createResponse.status).toBe(409)
    expect(createResponse.body.error).toBe(
      'You already have a main project. Leave or switch before creating.',
    )
  })

  it('allows admin to mark project completed and blocks new joins afterwards', async () => {
    const app = createApp()
    const participantId = await createParticipantForTest(app, 'join-after-complete')

    const complete = await request(app).post('/projects/proj-team-finder/complete').send({
      participantId: 'admin-coordinator',
    })
    expect(complete.status).toBe(200)
    expect(complete.body.project.status).toBe('completed')

    const blockedJoin = await request(app).post('/projects/proj-team-finder/join').send({
      participantId,
    })
    expect(blockedJoin.status).toBe(409)
    expect(blockedJoin.body.error).toBe('Completed projects cannot be joined.')
  })

  it('rejects non-admin project completion requests', async () => {
    const app = createApp()
    const participantId = await createParticipantForTest(app, 'complete-non-admin')

    const complete = await request(app).post('/projects/proj-team-finder/complete').send({
      participantId,
    })
    expect(complete.status).toBe(403)
    expect(complete.body.error).toBe('Only admin can complete projects.')
  })

  it('rejects invalid create project payload lengths', async () => {
    const app = createApp()
    const participantId = await createParticipantForTest(app, 'create-validation')

    const createResponse = await request(app).post('/projects').send({
      participantId,
      title: 'x',
      description: 'short',
      techStack: '',
      leadName: 'a',
    })

    expect(createResponse.status).toBe(400)
    expect(typeof createResponse.body.error).toBe('string')
  })
})
