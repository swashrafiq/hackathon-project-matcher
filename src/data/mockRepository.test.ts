import { describe, expect, it } from 'vitest'
import {
  getMockProjectById,
  getMockProjects,
  getMockUserByEmail,
  getMockUsers,
} from './mockRepository'

describe('mockRepository', () => {
  it('returns the mocked project collection', () => {
    const projects = getMockProjects()
    expect(projects.length).toBeGreaterThanOrEqual(3)
  })

  it('returns a project by id and null for unknown ids', () => {
    expect(getMockProjectById('proj-smart-schedule')?.title).toBe(
      'Smart Schedule Builder',
    )
    expect(getMockProjectById('missing-project')).toBeNull()
  })

  it('returns a user by email and applies nullable defaults', () => {
    const user = getMockUserByEmail('  LEO@EXAMPLE.COM ')
    expect(user?.name).toBe('Leo')
    expect(user?.mainProjectId).toBeNull()
    expect(Array.isArray(user?.watchedProjectIds)).toBe(true)
  })

  it('returns cloned values that do not mutate source data', () => {
    const users = getMockUsers()
    users[0].watchedProjectIds.push('proj-test')

    const usersAgain = getMockUsers()
    expect(usersAgain[0].watchedProjectIds).not.toContain('proj-test')
  })
})
