import { getDatabasePath } from './config'
import { openDatabase } from './connection'

interface SeedUser {
  id: string
  name: string
  email: string
  role: 'participant' | 'admin'
  mainProjectId: string | null
}

interface SeedProject {
  id: string
  title: string
  description: string
  techStack: string
  leadName: string
  memberCount: number
  status: 'active' | 'completed'
  createdByUserId: string
}

const SEED_USERS: SeedUser[] = [
  {
    id: 'admin-coordinator',
    name: 'Event Coordinator',
    email: 'admin@hackathon.local',
    role: 'admin',
    mainProjectId: null,
  },
  {
    id: 'user-smart-schedule-lead',
    name: 'Nadia Khan',
    email: 'nadia@example.com',
    role: 'participant',
    mainProjectId: 'proj-smart-schedule',
  },
]

const SEED_PROJECTS: SeedProject[] = [
  {
    id: 'proj-smart-schedule',
    title: 'Smart Schedule Builder',
    description: 'Generate personalized hackathon schedules from tracks and interests.',
    techStack: 'React, TypeScript',
    leadName: 'Nadia Khan',
    memberCount: 3,
    status: 'active',
    createdByUserId: 'admin-coordinator',
  },
  {
    id: 'proj-team-finder',
    title: 'Team Finder',
    description: 'Match participants by skills and project interests.',
    techStack: 'Node.js, SQLite',
    leadName: 'Event Coordinator',
    memberCount: 2,
    status: 'active',
    createdByUserId: 'admin-coordinator',
  },
]

export function seedDevelopmentData(databasePath = getDatabasePath()): void {
  const database = openDatabase(databasePath)

  try {
    const insertUser = database.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, role, main_project_id)
      VALUES (?, ?, ?, ?, ?)
    `)
    const insertProject = database.prepare(`
      INSERT OR IGNORE INTO projects (
        id,
        title,
        description,
        tech_stack,
        lead_name,
        member_count,
        status,
        created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    database.exec('BEGIN')
    try {
      for (const user of SEED_USERS) {
        insertUser.run(
          user.id,
          user.name,
          user.email,
          user.role,
          user.mainProjectId,
        )
      }

      for (const project of SEED_PROJECTS) {
        insertProject.run(
          project.id,
          project.title,
          project.description,
          project.techStack,
          project.leadName,
          project.memberCount,
          project.status,
          project.createdByUserId,
        )
      }

      database.exec('COMMIT')
    } catch (error) {
      database.exec('ROLLBACK')
      throw error
    }
  } finally {
    database.close()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDevelopmentData()
  console.log('Database seed completed.')
}
