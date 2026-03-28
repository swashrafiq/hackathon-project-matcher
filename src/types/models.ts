export type UserRole = 'participant' | 'admin'
export type ProjectStatus = 'active' | 'completed'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  mainProjectId: string | null
  watchedProjectIds: string[]
}

export interface Project {
  id: string
  title: string
  description: string
  techStack: string
  leadName: string
  memberCount: number
  status: ProjectStatus
  createdByUserId: string
  memberIds: string[]
}

export type ProjectReadModel = Pick<
  Project,
  'id' | 'title' | 'description' | 'techStack' | 'leadName' | 'memberCount' | 'status'
>
