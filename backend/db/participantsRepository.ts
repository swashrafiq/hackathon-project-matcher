import { randomUUID } from 'node:crypto'
import { getDatabasePath } from './config'
import { openDatabase } from './connection'

type ParticipantRole = 'participant' | 'admin'

export interface ParticipantRecord {
  id: string
  name: string
  email: string
  role: ParticipantRole
  mainProjectId: string | null
}

interface ParticipantRow {
  id: string
  name: string
  email: string
  role: ParticipantRole
  main_project_id: string | null
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

export function getParticipantByEmail(email: string): ParticipantRecord | null {
  const database = openDatabase(getDatabasePath())

  try {
    const row = database
      .prepare(
        `
          SELECT id, name, email, role, main_project_id
          FROM users
          WHERE email = ?
          LIMIT 1
        `,
      )
      .get(email) as ParticipantRow | undefined

    return row ? mapParticipantRow(row) : null
  } finally {
    database.close()
  }
}

export function createParticipant(name: string, email: string): ParticipantRecord {
  const database = openDatabase(getDatabasePath())

  try {
    const participantId = `user-${randomUUID().slice(0, 8)}`

    database
      .prepare(
        `
          INSERT INTO users (id, name, email, role, main_project_id)
          VALUES (?, ?, ?, 'participant', NULL)
        `,
      )
      .run(participantId, name, email)

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

    if (!row) {
      throw new Error('Failed to load created participant.')
    }

    return mapParticipantRow(row)
  } finally {
    database.close()
  }
}
