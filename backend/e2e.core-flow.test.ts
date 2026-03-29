import { rmSync } from 'node:fs'
import { join } from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from './app'
import { getDatabasePath } from './db/config'

async function createParticipant(app: ReturnType<typeof createApp>, label: string) {
  const response = await request(app).post('/participants').send({
    name: `E2E ${label}`,
    email: `e2e.${label}.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`,
  })

  expect(response.status).toBe(201)
  return {
    id: response.body.participant.id as string,
    sessionToken: response.body.sessionToken as string,
  }
}

describe('core E2E flows', () => {
  beforeEach(() => {
    process.env.DATABASE_PATH = join(
      process.cwd(),
      'backend',
      'data',
      `test-e2e-${Date.now()}-${Math.floor(Math.random() * 10000)}.sqlite`,
    )
  })

  afterEach(() => {
    const databasePath = getDatabasePath()
    delete process.env.DATABASE_PATH
    rmSync(databasePath, { force: true })
  })

  it('runs participant flow: entry -> browse -> details -> join -> switch -> leave -> watch -> create', async () => {
    const app = createApp()
    const participant = await createParticipant(app, 'core')

    expect((await request(app).get('/projects')).status).toBe(200)
    expect((await request(app).get('/projects/proj-team-finder')).status).toBe(200)
    expect(
      (await request(app)
        .post('/projects/proj-team-finder/join')
        .set('Authorization', `Bearer ${participant.sessionToken}`)
        .send({ participantId: participant.id })).status,
    ).toBe(200)
    expect(
      (await request(app)
        .post('/projects/proj-smart-schedule/switch')
        .set('Authorization', `Bearer ${participant.sessionToken}`)
        .send({ participantId: participant.id })).status,
    ).toBe(200)
    expect(
      (await request(app)
        .post('/projects/proj-smart-schedule/leave')
        .set('Authorization', `Bearer ${participant.sessionToken}`)
        .send({ participantId: participant.id })).status,
    ).toBe(200)
    expect(
      (await request(app)
        .post(`/participants/${participant.id}/watches/proj-team-finder`)
        .set('Authorization', `Bearer ${participant.sessionToken}`)).status,
    ).toBe(200)

    const create = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${participant.sessionToken}`)
      .send({
        participantId: participant.id,
        title: 'E2E Created Project',
        description: 'End-to-end created project for flow coverage.',
        techStack: 'TypeScript, SQLite',
        leadName: 'E2E User',
      })
    expect(create.status).toBe(201)
  })

  it('runs admin flow: complete project and verify join blocked with unauthorized guard', async () => {
    const app = createApp()
    const participant = await createParticipant(app, 'admin')

    const unauthorizedComplete = await request(app)
      .post('/projects/proj-team-finder/complete')
      .set('Authorization', `Bearer ${participant.sessionToken}`)
      .send({
        participantId: participant.id,
      })
    expect(unauthorizedComplete.status).toBe(403)

    const admin = await request(app).post('/participants').send({
      name: 'Admin Coordinator',
      email: 'admin@hackathon.local',
    })
    expect(admin.status).toBe(200)

    const adminComplete = await request(app)
      .post('/projects/proj-team-finder/complete')
      .set('Authorization', `Bearer ${admin.body.sessionToken as string}`)
      .send({
        participantId: admin.body.participant.id as string,
      })
    expect(adminComplete.status).toBe(200)

    const blockedJoin = await request(app)
      .post('/projects/proj-team-finder/join')
      .set('Authorization', `Bearer ${participant.sessionToken}`)
      .send({
        participantId: participant.id,
      })
    expect(blockedJoin.status).toBe(409)
    expect(blockedJoin.body.error).toBe('Completed projects cannot be joined.')
  })
})
