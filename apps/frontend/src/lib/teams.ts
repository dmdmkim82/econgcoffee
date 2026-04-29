import type { Team } from './meeting'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const STORAGE_KEY = 'ekong-coffee-teams-v1'

export const DEFAULT_TEAM_SEEDS: Array<{ name: string; members: string[] }> = [
  {
    name: '연료전지영업팀',
    members: [
      '정용훈',
      '송용원',
      '이충봉',
      '김가혁',
      '김기선',
      '김동민',
      '김산',
      '김영선',
      '김창섭',
      '박민범',
      '송상현',
      '심현진',
      '이설하',
      '이용훈',
      '주환범',
      '최성원',
    ],
  },
  {
    name: '분산발전영업팀',
    members: [
      '탁종호',
      '고정범',
      '김현회',
      '손정주',
      '양석준',
      '윤준영',
      '이건호',
      '이동원',
      '이상은',
      '최두연',
      '조광희',
    ],
  },
]

export function createTeamId() {
  return `team-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function dedupeMemberNames(names: readonly string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of names) {
    const trimmed = (raw ?? '').trim().replace(/\s+/g, ' ')
    if (!trimmed) continue
    const key = trimmed.normalize('NFKC').toLocaleLowerCase('ko-KR')
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }
  return result
}

export function loadTeamsFromStorage(): Team[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Team[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveTeamsToStorage(teams: Team[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(teams))
  } catch {
    // ignore quota errors
  }
}

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!response.ok) {
    throw new Error(`Teams API failed: ${response.status}`)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export async function fetchTeamsFromApi(): Promise<Team[]> {
  const payload = await jsonRequest<{ teams: Team[] }>('/api/teams')
  return Array.isArray(payload.teams) ? payload.teams : []
}

export async function saveTeamToApi(team: Team): Promise<Team> {
  const payload = await jsonRequest<{ team: Team }>(
    `/api/teams/${encodeURIComponent(team.id)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ team }),
    },
  )
  return payload.team
}

export async function deleteTeamFromApi(teamId: string): Promise<void> {
  await jsonRequest<void>(`/api/teams/${encodeURIComponent(teamId)}`, {
    method: 'DELETE',
  })
}

export function buildSeedTeams(): Team[] {
  const now = new Date().toISOString()
  return DEFAULT_TEAM_SEEDS.map((seed) => ({
    id: createTeamId(),
    name: seed.name,
    members: [...seed.members],
    createdAt: now,
    updatedAt: now,
  }))
}
