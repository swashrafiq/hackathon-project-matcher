import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { getDatabasePath } from './config'
import { openDatabase } from './connection'

const MIGRATIONS_DIRECTORY = join(process.cwd(), 'backend', 'db', 'migrations')

function listMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIRECTORY)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right))
}

export function runMigrations(databasePath = getDatabasePath()): void {
  const database = openDatabase(databasePath)

  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL
      );
    `)

    const getAppliedMigration = database.prepare(
      'SELECT file_name FROM schema_migrations WHERE file_name = ?',
    )
    const saveAppliedMigration = database.prepare(
      'INSERT INTO schema_migrations (file_name, applied_at) VALUES (?, ?)',
    )

    for (const migrationFile of listMigrationFiles()) {
      const exists = getAppliedMigration.get(migrationFile) as { file_name: string } | undefined
      if (exists) {
        continue
      }

      const migrationSql = readFileSync(
        join(MIGRATIONS_DIRECTORY, migrationFile),
        'utf-8',
      )

      database.exec('BEGIN')
      try {
        database.exec(migrationSql)
        saveAppliedMigration.run(migrationFile, new Date().toISOString())
        database.exec('COMMIT')
      } catch (error) {
        database.exec('ROLLBACK')
        throw error
      }
    }
  } finally {
    database.close()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
  console.log('Database migrations completed.')
}
