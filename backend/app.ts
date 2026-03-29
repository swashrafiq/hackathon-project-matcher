import cors, { type CorsOptions } from 'cors'
import express from 'express'
import helmet from 'helmet'
import {
  createParticipant,
  getParticipantByEmail,
  getParticipantById,
} from './db/participantsRepository'
import { runMigrations } from './db/migrate'
import { seedDevelopmentData } from './db/seed'
import {
  createProject,
  getProjectById,
  listProjects,
  markProjectCompleted,
} from './db/projectsRepository'
import {
  JoinProjectError,
  joinParticipantToProject,
  leaveParticipantProject,
  switchParticipantProject,
} from './db/joinRepository'
import {
  listWatchedProjectIds,
  unwatchProject,
  watchProject,
  WatchProjectError,
} from './db/watchRepository'
import {
  isValidEmail,
  isValidProjectId,
  isValidUserId,
  sanitizeEmail,
  sanitizeText,
  validateCreateProjectPayload,
} from './validation'
import { logAction, reportError } from './observability'

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']

function getParticipantIdFromBody(body: unknown): string {
  const rawParticipantId =
    typeof (body as { participantId?: unknown })?.participantId === 'string'
      ? (body as { participantId: string }).participantId
      : ''

  return sanitizeText(rawParticipantId)
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
      methods: ['GET', 'POST', 'DELETE'],
      allowedHeaders: ['Accept', 'Content-Type'],
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

    if (!isValidProjectId(projectId)) {
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
    const normalizedEmail = sanitizeEmail(rawEmail)

    if (!normalizedName) {
      res.status(400).json({ error: 'Please enter your name.' })
      return
    }

    if (!isValidEmail(normalizedEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' })
      return
    }

    const existingParticipant = getParticipantByEmail(normalizedEmail)
    if (existingParticipant) {
      logAction('participant_lookup_existing', {
        participantId: existingParticipant.id,
        participantEmail: existingParticipant.email,
      })
      res.status(200).json({ participant: existingParticipant, source: 'existing' })
      return
    }

    const participant = createParticipant(normalizedName, normalizedEmail)
    logAction('participant_created', {
      participantId: participant.id,
      participantEmail: participant.email,
    })
    res.status(201).json({ participant, source: 'created' })
  })

  app.post('/projects/:projectId/join', (req, res) => {
    const { projectId } = req.params
    const participantId = getParticipantIdFromBody(req.body)

    if (!isValidProjectId(projectId)) {
      res.status(400).json({ error: 'Invalid project id format.' })
      return
    }

    if (!isValidUserId(participantId)) {
      res.status(400).json({ error: 'Invalid participant id format.' })
      return
    }

    try {
      const result = joinParticipantToProject(participantId, projectId)
      logAction('project_join', { participantId, projectId, source: result.source })
      res.status(200).json(result)
    } catch (error) {
      if (error instanceof JoinProjectError) {
        if (error.code === 'project_full' || error.code === 'project_completed') {
          res.status(409).json({ error: error.message })
          return
        }

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

      reportError(error, { route: 'project_join', participantId, projectId })
      res.status(500).json({ error: 'Unable to join project right now.' })
    }
  })

  app.post('/projects/:projectId/leave', (req, res) => {
    const { projectId } = req.params
    const participantId = getParticipantIdFromBody(req.body)

    if (!isValidProjectId(projectId)) {
      res.status(400).json({ error: 'Invalid project id format.' })
      return
    }

    if (!isValidUserId(participantId)) {
      res.status(400).json({ error: 'Invalid participant id format.' })
      return
    }

    try {
      const result = leaveParticipantProject(participantId, projectId)
      logAction('project_leave', { participantId, projectId, source: result.source })
      res.status(200).json(result)
    } catch (error) {
      if (error instanceof JoinProjectError) {
        if (error.code === 'not_current_main_project') {
          res.status(409).json({ error: error.message })
          return
        }

        if (error.code === 'project_not_found' || error.code === 'participant_not_found') {
          res.status(404).json({ error: error.message })
          return
        }

        if (error.code === 'membership_state_invalid') {
          res.status(409).json({ error: error.message })
          return
        }
      }

      reportError(error, { route: 'project_leave', participantId, projectId })
      res.status(500).json({ error: 'Unable to leave project right now.' })
    }
  })

  app.post('/projects/:projectId/switch', (req, res) => {
    const { projectId } = req.params
    const participantId = getParticipantIdFromBody(req.body)

    if (!isValidProjectId(projectId)) {
      res.status(400).json({ error: 'Invalid project id format.' })
      return
    }

    if (!isValidUserId(participantId)) {
      res.status(400).json({ error: 'Invalid participant id format.' })
      return
    }

    try {
      const result = switchParticipantProject(participantId, projectId)
      logAction('project_switch', { participantId, projectId, source: result.source })
      res.status(200).json(result)
    } catch (error) {
      if (error instanceof JoinProjectError) {
        if (
          error.code === 'project_full' ||
          error.code === 'no_main_project' ||
          error.code === 'membership_state_invalid'
        ) {
          res.status(409).json({ error: error.message })
          return
        }

        if (error.code === 'project_not_found' || error.code === 'participant_not_found') {
          res.status(404).json({ error: error.message })
          return
        }
      }

      reportError(error, { route: 'project_switch', participantId, projectId })
      res.status(500).json({ error: 'Unable to switch project right now.' })
    }
  })

  app.post('/projects', (req, res) => {
    const participantId = getParticipantIdFromBody(req.body)
    if (!isValidUserId(participantId)) {
      res.status(400).json({ error: 'Invalid participant id format.' })
      return
    }

    const creator = getParticipantById(participantId)
    if (!creator) {
      res.status(404).json({ error: 'Participant not found.' })
      return
    }

    if (creator.mainProjectId) {
      res
        .status(409)
        .json({ error: 'You already have a main project. Leave or switch before creating.' })
      return
    }

    try {
      const input = validateCreateProjectPayload(req.body)
      const project = createProject({
        ...input,
        creatorId: participantId,
      })

      const updatedCreator = getParticipantById(participantId)
      logAction('project_created', { participantId, projectId: project.id })
      res.status(201).json({
        project,
        participant: updatedCreator,
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('must be between')) {
        res.status(400).json({ error: error.message })
        return
      }

      reportError(error, { route: 'project_create', participantId })
      res.status(500).json({ error: 'Unable to create project right now.' })
    }
  })

  app.post('/projects/:projectId/complete', (req, res) => {
    const { projectId } = req.params
    const participantId = getParticipantIdFromBody(req.body)

    if (!isValidProjectId(projectId)) {
      res.status(400).json({ error: 'Invalid project id format.' })
      return
    }

    if (!isValidUserId(participantId)) {
      res.status(400).json({ error: 'Invalid participant id format.' })
      return
    }

    const participant = getParticipantById(participantId)
    if (!participant) {
      res.status(404).json({ error: 'Participant not found.' })
      return
    }

    if (participant.role !== 'admin') {
      res.status(403).json({ error: 'Only admin can complete projects.' })
      return
    }

    const completed = markProjectCompleted(projectId)
    if (!completed) {
      res.status(404).json({ error: 'Project not found.' })
      return
    }

    logAction('project_completed', { participantId, projectId: completed.id })
    res.status(200).json({ project: completed, source: 'completed' })
  })

  app.get('/participants/:participantId/watches', (req, res) => {
    const { participantId } = req.params
    if (!isValidUserId(participantId)) {
      res.status(400).json({ error: 'Invalid participant id format.' })
      return
    }

    try {
      const watchedProjectIds = listWatchedProjectIds(participantId)
      res.status(200).json({ watchedProjectIds })
    } catch (error) {
      if (error instanceof WatchProjectError && error.code === 'participant_not_found') {
        res.status(404).json({ error: error.message })
        return
      }

      reportError(error, { route: 'watch_list', participantId })
      res.status(500).json({ error: 'Unable to load watched projects right now.' })
    }
  })

  app.post('/participants/:participantId/watches/:projectId', (req, res) => {
    const { participantId, projectId } = req.params
    if (!isValidUserId(participantId)) {
      res.status(400).json({ error: 'Invalid participant id format.' })
      return
    }

    if (!isValidProjectId(projectId)) {
      res.status(400).json({ error: 'Invalid project id format.' })
      return
    }

    try {
      watchProject(participantId, projectId)
      const watchedProjectIds = listWatchedProjectIds(participantId)
      logAction('project_watched', { participantId, projectId })
      res.status(200).json({ watchedProjectIds, source: 'watched' })
    } catch (error) {
      if (error instanceof WatchProjectError) {
        if (error.code === 'participant_not_found' || error.code === 'project_not_found') {
          res.status(404).json({ error: error.message })
          return
        }
      }

      reportError(error, { route: 'watch_add', participantId, projectId })
      res.status(500).json({ error: 'Unable to watch project right now.' })
    }
  })

  app.delete('/participants/:participantId/watches/:projectId', (req, res) => {
    const { participantId, projectId } = req.params
    if (!isValidUserId(participantId)) {
      res.status(400).json({ error: 'Invalid participant id format.' })
      return
    }

    if (!isValidProjectId(projectId)) {
      res.status(400).json({ error: 'Invalid project id format.' })
      return
    }

    try {
      unwatchProject(participantId, projectId)
      const watchedProjectIds = listWatchedProjectIds(participantId)
      logAction('project_unwatched', { participantId, projectId })
      res.status(200).json({ watchedProjectIds, source: 'unwatched' })
    } catch (error) {
      if (error instanceof WatchProjectError) {
        if (error.code === 'participant_not_found' || error.code === 'project_not_found') {
          res.status(404).json({ error: error.message })
          return
        }
      }

      reportError(error, { route: 'watch_remove', participantId, projectId })
      res.status(500).json({ error: 'Unable to unwatch project right now.' })
    }
  })

  return app
}
