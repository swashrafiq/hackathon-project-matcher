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
  status: 'active' | 'completed'
}

export type JoinResultSource = 'joined' | 'already_joined'
export type LeaveResultSource = 'left'
export type SwitchResultSource = 'switched' | 'already_joined'

export interface JoinResult {
  participant: ParticipantRecord
  source: JoinResultSource
}

export interface LeaveResult {
  participant: ParticipantRecord
  source: LeaveResultSource
}

export interface SwitchResult {
  participant: ParticipantRecord
  source: SwitchResultSource
}

type JoinErrorCode =
  | 'participant_not_found'
  | 'project_not_found'
  | 'project_completed'
  | 'project_full'
  | 'already_has_main_project'
  | 'not_current_main_project'
  | 'no_main_project'
  | 'membership_state_invalid'

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

function getProject(database: DatabaseSync, projectId: string): ProjectExistsRow | null {
  const row = database
    .prepare(
      `
        SELECT id, status
        FROM projects
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(projectId) as ProjectExistsRow | undefined

  return row || null
}

function incrementProjectMemberCountIfCapacity(
  database: DatabaseSync,
  projectId: string,
): number {
  const result = database
    .prepare(
      `
        UPDATE projects
        SET member_count = member_count + 1
        WHERE id = ? AND member_count < 5
      `,
    )
    .run(projectId) as { changes?: number }

  return result.changes ?? 0
}

function decrementProjectMemberCount(database: DatabaseSync, projectId: string): number {
  const result = database
    .prepare(
      `
        UPDATE projects
        SET member_count = member_count - 1
        WHERE id = ? AND member_count > 0
      `,
    )
    .run(projectId) as { changes?: number }

  return result.changes ?? 0
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

    const project = getProject(database, projectId)
    if (!project) {
      throw new JoinProjectError('project_not_found', 'Project not found.')
    }

    if (project.status === 'completed') {
      throw new JoinProjectError('project_completed', 'Completed projects cannot be joined.')
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

    const incrementChanges = incrementProjectMemberCountIfCapacity(database, projectId)
    if (incrementChanges === 0) {
      throw new JoinProjectError('project_full', 'Project is full.')
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

export function leaveParticipantProject(participantId: string, projectId: string): LeaveResult {
  const database = openDatabase(getDatabasePath())

  try {
    database.exec('BEGIN')

    const participant = getParticipant(database, participantId)
    if (!participant) {
      throw new JoinProjectError('participant_not_found', 'Participant not found.')
    }

    const project = getProject(database, projectId)
    if (!project) {
      throw new JoinProjectError('project_not_found', 'Project not found.')
    }

    if (participant.main_project_id !== projectId) {
      throw new JoinProjectError(
        'not_current_main_project',
        'You can only leave your current main project.',
      )
    }

    const decrementChanges = decrementProjectMemberCount(database, projectId)
    if (decrementChanges === 0) {
      throw new JoinProjectError(
        'membership_state_invalid',
        'Project membership state is invalid. Try again.',
      )
    }

    database
      .prepare(
        `
          UPDATE users
          SET main_project_id = NULL
          WHERE id = ?
        `,
      )
      .run(participantId)

    const updatedParticipant = getParticipant(database, participantId)
    if (!updatedParticipant) {
      throw new Error('Unable to reload participant after leave.')
    }

    database.exec('COMMIT')
    return {
      participant: mapParticipantRow(updatedParticipant),
      source: 'left',
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

export function switchParticipantProject(
  participantId: string,
  targetProjectId: string,
): SwitchResult {
  const database = openDatabase(getDatabasePath())

  try {
    database.exec('BEGIN')

    const participant = getParticipant(database, participantId)
    if (!participant) {
      throw new JoinProjectError('participant_not_found', 'Participant not found.')
    }

    const targetProject = getProject(database, targetProjectId)
    if (!targetProject) {
      throw new JoinProjectError('project_not_found', 'Project not found.')
    }

    if (targetProject.status === 'completed') {
      throw new JoinProjectError('project_completed', 'Completed projects cannot be joined.')
    }

    if (!participant.main_project_id) {
      throw new JoinProjectError(
        'no_main_project',
        'No current main project found. Join a project first.',
      )
    }

    if (participant.main_project_id === targetProjectId) {
      database.exec('COMMIT')
      return {
        participant: mapParticipantRow(participant),
        source: 'already_joined',
      }
    }

    const currentProjectId = participant.main_project_id
    const decrementChanges = decrementProjectMemberCount(database, currentProjectId)
    if (decrementChanges === 0) {
      throw new JoinProjectError(
        'membership_state_invalid',
        'Current project membership state is invalid. Try again.',
      )
    }

    const incrementChanges = incrementProjectMemberCountIfCapacity(database, targetProjectId)
    if (incrementChanges === 0) {
      throw new JoinProjectError('project_full', 'Project is full.')
    }

    database
      .prepare(
        `
          UPDATE users
          SET main_project_id = ?
          WHERE id = ?
        `,
      )
      .run(targetProjectId, participantId)

    const updatedParticipant = getParticipant(database, participantId)
    if (!updatedParticipant) {
      throw new Error('Unable to reload participant after switch.')
    }

    database.exec('COMMIT')
    return {
      participant: mapParticipantRow(updatedParticipant),
      source: 'switched',
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
