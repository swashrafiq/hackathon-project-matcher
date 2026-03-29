import { describe, expect, it, vi } from 'vitest'
import {
  fetchWatchedProjectIds,
  unwatchProjectByParticipant,
  watchProjectByParticipant,
} from './watches'

describe('watches API client', () => {
  it('loads watched project ids for participant', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:9000')

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          watchedProjectIds: ['proj-smart-schedule', 'proj-team-finder'],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const watched = await fetchWatchedProjectIds('user-test', fetchMock)
    expect(watched).toEqual(['proj-smart-schedule', 'proj-team-finder'])
    expect(fetchMock).toHaveBeenCalledOnce()

    vi.unstubAllEnvs()
  })

  it('adds and removes watched project id via toggle endpoints', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:9000')

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            watchedProjectIds: ['proj-smart-schedule'],
            source: 'watched',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      })
      .mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            watchedProjectIds: [],
            source: 'unwatched',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      })

    const watchedAfterAdd = await watchProjectByParticipant(
      'user-test',
      'proj-smart-schedule',
      fetchMock,
    )
    const watchedAfterRemove = await unwatchProjectByParticipant(
      'user-test',
      'proj-smart-schedule',
      fetchMock,
    )

    expect(watchedAfterAdd).toEqual(['proj-smart-schedule'])
    expect(watchedAfterRemove).toEqual([])

    vi.unstubAllEnvs()
  })
})
