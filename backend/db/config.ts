import { resolve } from 'node:path'

const DEFAULT_DATABASE_PATH = 'backend/data/hackathon.sqlite'

export function getDatabasePath(): string {
  const configuredPath = process.env.DATABASE_PATH?.trim()
  return resolve(configuredPath || DEFAULT_DATABASE_PATH)
}
