import { mockProjects, mockUsers } from './mockData'
import type { Project, User } from '../types/models'

function normalizeUser(user: User): User {
  return {
    ...user,
    mainProjectId: user.mainProjectId ?? null,
    watchedProjectIds: Array.isArray(user.watchedProjectIds)
      ? [...user.watchedProjectIds]
      : [],
  }
}

export function getMockProjects(): Project[] {
  return mockProjects.map((project) => ({ ...project, memberIds: [...project.memberIds] }))
}

export function getMockProjectById(projectId: string): Project | null {
  const project = mockProjects.find((item) => item.id === projectId)
  return project ? { ...project, memberIds: [...project.memberIds] } : null
}

export function getMockUsers(): User[] {
  return mockUsers.map((user) => normalizeUser({ ...user }))
}

export function getMockUserByEmail(email: string): User | null {
  const normalizedEmail = email.trim().toLowerCase()
  const user = mockUsers.find((item) => item.email.toLowerCase() === normalizedEmail)
  return user ? normalizeUser({ ...user }) : null
}
