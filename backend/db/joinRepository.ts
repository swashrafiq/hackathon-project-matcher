import type { DatabaseSync } from 'node:sqlite'
import { getDatabasePath } from './config'
import { openDatabase } from './connection'
import type { ParticipantRecord } from './participantsRepository'

interface ParticipantRow {
  id: string
  name: string
  email: string
  role: 'participant' | 'admin'
  main_project_id: string | null
}

interface ProjectExistsRow {
  id: string
}

export type JoinResultSource = 'joined' | 'already_joined'

export interface JoinResult {
  participant: ParticipantRecord
  source: JoinResultSource
}

type JoinErrorCode =
  | 'participant_not_found'
  | 'project_not_found'
  | 'already_has_main_project'

export class JoinProjectError extends Error {
  code: JoinErrorCode

  constructor(code: JoinErrorCode, message: string) {
    super(message)
    this.name = 'JoinProjectError'
    this.code = code
  }
}

function mapParticipantRow(row: ParticipantRow): ParticipantRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    mainProjectId: row.main_project_id,
  }
}

function getParticipant(database: DatabaseSync, participantId: string): ParticipantRow | null {
  const row = database
    .prepare(
      `
        SELECT id, name, email, role, main_project_id
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(participantId) as ParticipantRow | undefined

  return row || null
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
    .get(projectId) as ProjectExistsRow | undefined

  return Boolean(row)
}

export function joinParticipantToProject(
  participantId: string,
  projectId: string,
): JoinResult {
  const database = openDatabase(getDatabasePath())

  try {
    database.exec('BEGIN')

    const participant = getParticipant(database, participantId)
    if (!participant) {
      throw new JoinProjectError('participant_not_found', 'Participant not found.')
    }

    if (!projectExists(database, projectId)) {
      throw new JoinProjectError('project_not_found', 'Project not found.')
    }

    if (participant.main_project_id === projectId) {
      database.exec('COMMIT')
      return {
        participant: mapParticipantRow(participant),
        source: 'already_joined',
      }
    }

    if (participant.main_project_id) {
      throw new JoinProjectError(
        'already_has_main_project',
        'You already have a main project. Leave or switch before joining another.',
      )
    }

    database
      .prepare(
        `
          UPDATE users
          SET main_project_id = ?
          WHERE id = ?
        `,
      )
      .run(projectId, participantId)

    database
      .prepare(
        `
          UPDATE projects
          SET member_count = member_count + 1
          WHERE id = ?
        `,
      )
      .run(projectId)

    const updatedParticipant = getParticipant(database, participantId)
    if (!updatedParticipant) {
      throw new Error('Unable to reload participant after join.')
    }

    database.exec('COMMIT')
    return {
      participant: mapParticipantRow(updatedParticipant),
      source: 'joined',
    }
  } catch (error) {
    try {
      database.exec('ROLLBACK')
    } catch {
      // Ignore rollback errors; original error is more relevant.
    }
    throw error
  } finally {
    database.close()
  }
}
