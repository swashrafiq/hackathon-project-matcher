import type { DatabaseSync } from 'node:sqlite'
import { getDatabasePath } from './config'
import { openDatabase } from './connection'

type WatchErrorCode = 'participant_not_found' | 'project_not_found'

export class WatchProjectError extends Error {
  code: WatchErrorCode

  constructor(code: WatchErrorCode, message: string) {
    super(message)
    this.name = 'WatchProjectError'
    this.code = code
  }
}

function withDatabase<T>(callback: (database: DatabaseSync) => T): T {
  const database = openDatabase(getDatabasePath())
  try {
    return callback(database)
  } finally {
    database.close()
  }
}

function userExists(database: DatabaseSync, userId: string): boolean {
  const row = database
    .prepare(
      `
        SELECT id
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(userId) as { id: string } | undefined

  return Boolean(row)
}

function projectExists(database: DatabaseSync, projectId: string): boolean {
  const row = database
    .prepare(
      `
        SELECT id
        FROM projects
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(projectId) as { id: string } | undefined

  return Boolean(row)
}

function assertWatchEntities(database: DatabaseSync, userId: string, projectId: string): void {
  if (!userExists(database, userId)) {
    throw new WatchProjectError('participant_not_found', 'Participant not found.')
  }

  if (!projectExists(database, projectId)) {
    throw new WatchProjectError('project_not_found', 'Project not found.')
  }
}

export function listWatchedProjectIds(userId: string): string[] {
  return withDatabase((database) => {
    if (!userExists(database, userId)) {
      throw new WatchProjectError('participant_not_found', 'Participant not found.')
    }

    const rows = database
      .prepare(
        `
          SELECT project_id
          FROM user_project_watch
          WHERE user_id = ?
          ORDER BY project_id ASC
        `,
      )
      .all(userId) as unknown as Array<{ project_id: string }>

    return rows.map((row) => row.project_id)
  })
}

export function watchProject(userId: string, projectId: string): void {
  withDatabase((database) => {
    assertWatchEntities(database, userId, projectId)

    database
      .prepare(
        `
          INSERT OR IGNORE INTO user_project_watch (user_id, project_id)
          VALUES (?, ?)
        `,
      )
      .run(userId, projectId)
  })
}

export function unwatchProject(userId: string, projectId: string): void {
  withDatabase((database) => {
    assertWatchEntities(database, userId, projectId)

    database
      .prepare(
        `
          DELETE FROM user_project_watch
          WHERE user_id = ? AND project_id = ?
        `,
      )
      .run(userId, projectId)
  })
}
