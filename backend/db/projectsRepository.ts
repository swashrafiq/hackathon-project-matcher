import type { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'
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

interface ProjectStatusRow {
  id: string
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function createProject(params: {
  title: string
  description: string
  techStack: string
  leadName: string
  creatorId: string
}): ProjectReadRecord {
  return withDatabase((database) => {
    const baseSlug = slugify(params.title) || 'project'
    const projectId = `proj-${baseSlug}-${randomUUID().slice(0, 6)}`

    database.exec('BEGIN')
    try {
      database
        .prepare(
          `
            INSERT INTO projects (
              id,
              title,
              description,
              tech_stack,
              lead_name,
              member_count,
              status,
              created_by_user_id
            ) VALUES (?, ?, ?, ?, ?, 1, 'active', ?)
          `,
        )
        .run(
          projectId,
          params.title,
          params.description,
          params.techStack,
          params.leadName,
          params.creatorId,
        )

      database
        .prepare(
          `
            UPDATE users
            SET main_project_id = ?
            WHERE id = ?
          `,
        )
        .run(projectId, params.creatorId)

      const created = database
        .prepare(
          `
            SELECT id, title, description, tech_stack, lead_name, member_count, status
            FROM projects
            WHERE id = ?
            LIMIT 1
          `,
        )
        .get(projectId) as ProjectRow | undefined

      if (!created) {
        throw new Error('Unable to load created project.')
      }

      database.exec('COMMIT')
      return mapProjectRow(created)
    } catch (error) {
      database.exec('ROLLBACK')
      throw error
    }
  })
}

export function markProjectCompleted(projectId: string): ProjectReadRecord | null {
  return withDatabase((database) => {
    database
      .prepare(
        `
          UPDATE projects
          SET status = 'completed'
          WHERE id = ?
        `,
      )
      .run(projectId)

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

export function getProjectStatus(projectId: string): 'active' | 'completed' | null {
  return withDatabase((database) => {
    const row = database
      .prepare(
        `
          SELECT id, status
          FROM projects
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(projectId) as ProjectStatusRow | undefined

    return row ? row.status : null
  })
}
