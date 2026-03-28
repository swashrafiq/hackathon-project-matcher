import cors, { type CorsOptions } from 'cors'
import express from 'express'
import helmet from 'helmet'
import { runMigrations } from './db/migrate'
import { seedDevelopmentData } from './db/seed'
import { getProjectById, listProjects } from './db/projectsRepository'

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']
const PROJECT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/

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

  return app
}
