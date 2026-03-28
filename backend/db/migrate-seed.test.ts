import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { afterEach, describe, expect, it } from 'vitest'
import { runMigrations } from './migrate'
import { seedDevelopmentData } from './seed'

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'hpm-db-'))
  return join(directory, 'test.sqlite')
}

describe('database migrations and seed', () => {
  const createdDirectories: string[] = []

  afterEach(() => {
    for (const directory of createdDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('creates schema and inserts initial records', () => {
    const databasePath = createTempDatabasePath()
    createdDirectories.push(dirname(databasePath))

    runMigrations(databasePath)
    seedDevelopmentData(databasePath)

    const database = new DatabaseSync(databasePath)
    try {
      const usersCount = database
        .prepare('SELECT COUNT(*) as count FROM users')
        .get() as { count: number }
      const projectsCount = database
        .prepare('SELECT COUNT(*) as count FROM projects')
        .get() as { count: number }
      const migrationsCount = database
        .prepare('SELECT COUNT(*) as count FROM schema_migrations')
        .get() as { count: number }

      expect(usersCount.count).toBeGreaterThan(0)
      expect(projectsCount.count).toBeGreaterThan(0)
      expect(migrationsCount.count).toBeGreaterThan(0)
    } finally {
      database.close()
    }
  })

  it('uses parameterized queries safely for project lookup', () => {
    const databasePath = createTempDatabasePath()
    createdDirectories.push(dirname(databasePath))

    runMigrations(databasePath)
    seedDevelopmentData(databasePath)

    const database = new DatabaseSync(databasePath)
    try {
      const lookupProject = database.prepare(
        'SELECT id, title FROM projects WHERE id = ? LIMIT 1',
      )

      const validProject = lookupProject.get('proj-smart-schedule') as
        | { id: string; title: string }
        | undefined
      const injectedProject = lookupProject.get(
        "proj-smart-schedule' OR 1=1 --",
      ) as { id: string; title: string } | undefined

      expect(validProject?.id).toBe('proj-smart-schedule')
      expect(injectedProject).toBeUndefined()
    } finally {
      database.close()
    }
  })
})
