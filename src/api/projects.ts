import type { ProjectReadModel } from '../types/models'
import { getApiBaseUrl } from '../config/runtimeConfig'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

interface ProjectsResponse {
  projects: ProjectReadModel[]
}

interface ProjectResponse {
  project: ProjectReadModel
}

export async function fetchProjects(fetcher: Fetcher = fetch): Promise<ProjectReadModel[]> {
  const response = await fetcher(`${getApiBaseUrl()}/projects`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Projects request failed with status ${response.status}`)
  }

  const payload = (await response.json()) as Partial<ProjectsResponse>
  return Array.isArray(payload.projects) ? payload.projects : []
}

export async function fetchProjectById(
  projectId: string,
  fetcher: Fetcher = fetch,
): Promise<ProjectReadModel | null> {
  const response = await fetcher(
    `${getApiBaseUrl()}/projects/${encodeURIComponent(projectId)}`,
    { headers: { Accept: 'application/json' } },
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Project request failed with status ${response.status}`)
  }

  const payload = (await response.json()) as Partial<ProjectResponse>
  return payload.project ?? null
}
