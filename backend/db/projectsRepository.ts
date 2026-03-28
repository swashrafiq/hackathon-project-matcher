import type { DatabaseSync } from 'node:sqlite'
import { openDatabase } from './connection'
import { getDatabasePath } from './config'

export interface ProjectReadRecord {
  id: string
  title: string
  description: string
  techStack: string
  leadName: string
  memberCount: number
  status: 'active' | 'completed'
}

interface ProjectRow {
  id: string
  title: string
  description: string
  tech_stack: string
  lead_name: string
  member_count: number
  status: 'active' | 'completed'
}

function mapProjectRow(row: ProjectRow): ProjectReadRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    techStack: row.tech_stack,
    leadName: row.lead_name,
    memberCount: row.member_count,
    status: row.status,
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

export function listProjects(): ProjectReadRecord[] {
  return withDatabase((database) => {
    const rows = database
      .prepare(
        `
          SELECT id, title, description, tech_stack, lead_name, member_count, status
          FROM projects
          ORDER BY title ASC
        `,
      )
      .all() as unknown as ProjectRow[]

    return rows.map((row) => mapProjectRow(row))
  })
}

export function getProjectById(projectId: string): ProjectReadRecord | null {
  return withDatabase((database) => {
    const row = database
      .prepare(
        `
          SELECT id, title, description, tech_stack, lead_name, member_count, status
          FROM projects
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(projectId) as ProjectRow | undefined

    return row ? mapProjectRow(row) : null
  })
}
