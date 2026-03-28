import cors, { type CorsOptions } from 'cors'
import express from 'express'
import helmet from 'helmet'
import { createParticipant, getParticipantByEmail } from './db/participantsRepository'
import { runMigrations } from './db/migrate'
import { seedDevelopmentData } from './db/seed'
import { getProjectById, listProjects } from './db/projectsRepository'
import { JoinProjectError, joinParticipantToProject } from './db/joinRepository'

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']
const PROJECT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/
const USER_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sanitizeText(value: string): string {
  return value.replace(/[<>"']/g, '').trim()
}

interface ParticipantRateLimitEntry {
  count: number
  windowStart: number
}

function readAllowedOrigins(): Set<string> {
  const configuredOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  const origins = configuredOrigins?.length
    ? configuredOrigins
    : DEFAULT_ALLOWED_ORIGINS

  return new Set(origins)
}

function createCorsOriginValidator(allowedOrigins: Set<string>): CorsOptions['origin'] {
  return (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Origin not allowed by CORS policy'))
  }
}

export function createApp() {
  runMigrations()
  seedDevelopmentData()

  const app = express()
  const allowedOrigins = readAllowedOrigins()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '10kb' }))
  app.use(helmet())
  app.use(
    cors({
      origin: createCorsOriginValidator(allowedOrigins),
    }),
  )

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'hackathon-project-matcher-api',
    })
  })

  app.get('/projects', (_req, res) => {
    const projects = listProjects()
    res.status(200).json({ projects })
  })

  app.get('/projects/:projectId', (req, res) => {
    const { projectId } = req.params

    if (!PROJECT_ID_PATTERN.test(projectId)) {
      res.status(400).json({ error: 'Invalid project id format.' })
      return
    }

    const project = getProjectById(projectId)
    if (!project) {
      res.status(404).json({ error: 'Project not found.' })
      return
    }

    res.status(200).json({ project })
  })

  const participantRateLimits = new Map<string, ParticipantRateLimitEntry>()
  const participantRateWindowMs = Number.parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || '60000',
    10,
  )
  const participantRateMax = Number.parseInt(
    process.env.RATE_LIMIT_PARTICIPANT_MAX || '8',
    10,
  )

  app.post('/participants', (req, res) => {
    const clientKey = req.get('x-forwarded-for')?.split(',')[0].trim() || req.ip || 'unknown'
    const now = Date.now()
    const existingRate = participantRateLimits.get(clientKey)
    const isWithinWindow =
      existingRate && now - existingRate.windowStart < participantRateWindowMs

    if (isWithinWindow && existingRate.count >= participantRateMax) {
      res.status(429).json({ error: 'Too many participant attempts. Try again soon.' })
      return
    }

    const nextRate: ParticipantRateLimitEntry = isWithinWindow
      ? { windowStart: existingRate.windowStart, count: existingRate.count + 1 }
      : { windowStart: now, count: 1 }
    participantRateLimits.set(clientKey, nextRate)

    for (const [key, value] of participantRateLimits.entries()) {
      if (now - value.windowStart >= participantRateWindowMs) {
        participantRateLimits.delete(key)
      }
    }

    const rawName = typeof req.body?.name === 'string' ? req.body.name : ''
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email : ''
    const normalizedName = sanitizeText(rawName)
    const normalizedEmail = sanitizeText(rawEmail).toLowerCase()

    if (!normalizedName) {
      res.status(400).json({ error: 'Please enter your name.' })
      return
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' })
      return
    }

    const existingParticipant = getParticipantByEmail(normalizedEmail)
    if (existingParticipant) {
      res.status(200).json({ participant: existingParticipant, source: 'existing' })
      return
    }

    const participant = createParticipant(normalizedName, normalizedEmail)
    res.status(201).json({ participant, source: 'created' })
  })

  app.post('/projects/:projectId/join', (req, res) => {
    const { projectId } = req.params
    const rawParticipantId = typeof req.body?.participantId === 'string' ? req.body.participantId : ''
    const participantId = sanitizeText(rawParticipantId)

    if (!PROJECT_ID_PATTERN.test(projectId)) {
      res.status(400).json({ error: 'Invalid project id format.' })
      return
    }

    if (!USER_ID_PATTERN.test(participantId)) {
      res.status(400).json({ error: 'Invalid participant id format.' })
      return
    }

    try {
      const result = joinParticipantToProject(participantId, projectId)
      res.status(200).json(result)
    } catch (error) {
      if (error instanceof JoinProjectError) {
        if (error.code === 'already_has_main_project') {
          res.status(409).json({ error: error.message })
          return
        }

        if (error.code === 'project_not_found') {
          res.status(404).json({ error: error.message })
          return
        }

        if (error.code === 'participant_not_found') {
          res.status(404).json({ error: error.message })
          return
        }
      }

      res.status(500).json({ error: 'Unable to join project right now.' })
    }
  })

  return app
}
