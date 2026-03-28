import cors, { type CorsOptions } from 'cors'
import express from 'express'
import helmet from 'helmet'

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']

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

  return app
}
