import { createApp } from './app'
import { runMigrations } from './db/migrate'
import { seedDevelopmentData } from './db/seed'

const DEFAULT_API_PORT = 8787
const DEFAULT_API_HOST = '127.0.0.1'

function readApiPort(): number {
  const rawValue = process.env.API_PORT
  if (!rawValue) {
    return DEFAULT_API_PORT
  }

  const parsedValue = Number.parseInt(rawValue, 10)
  if (Number.isNaN(parsedValue) || parsedValue <= 0) {
    return DEFAULT_API_PORT
  }

  return parsedValue
}

function startServer() {
  runMigrations()
  seedDevelopmentData()

  const app = createApp()
  const apiPort = readApiPort()
  const apiHost = process.env.API_HOST || DEFAULT_API_HOST

  app.listen(apiPort, apiHost, () => {
    console.log(`API server listening on http://${apiHost}:${apiPort}`)
  })
}

startServer()
