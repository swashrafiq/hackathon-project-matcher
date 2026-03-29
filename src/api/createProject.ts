import { getApiBaseUrl } from '../config/runtimeConfig'
import type { ParticipantSession } from '../utils/participantSession'
import type { ProjectReadModel } from '../types/models'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export interface CreateProjectInput {
  title: string
  description: string
  techStack: string
  leadName: string
}

interface CreateProjectResponse {
  project: ProjectReadModel
  participant: ParticipantSession
}

interface ErrorResponse {
  error?: string
}

export async function createProjectByParticipant(
  participantId: string,
  input: CreateProjectInput,
  fetcher: Fetcher = fetch,
): Promise<CreateProjectResponse> {
  const response = await fetcher(`${getApiBaseUrl()}/projects`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      participantId,
      ...input,
    }),
  })

  const payload = (await response.json()) as Partial<CreateProjectResponse & ErrorResponse>
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to create project right now.')
  }

  if (!payload.project || !payload.participant) {
    throw new Error('Create project response payload is invalid.')
  }

  return {
    project: payload.project,
    participant: payload.participant,
  }
}
