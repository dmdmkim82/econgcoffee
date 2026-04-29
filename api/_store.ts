import { Redis } from '@upstash/redis'
import type { Snapshot, Team } from '../shared/meeting.js'

export type MeetingsStore = Record<string, Snapshot>
export type TeamsStore = Record<string, Team>

const MEETINGS_HASH = 'ekong:meetings'
const TEAMS_HASH = 'ekong:teams'

let cachedRedis: Redis | null = null

function resolveRedisCredentials() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.KV_REST_API_URL ??
    process.env.STORAGE_REST_API_URL
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN ??
    process.env.STORAGE_REST_API_TOKEN

  if (!url || !token) {
    return null
  }

  return { url, token }
}

export function isRedisConfigured() {
  return resolveRedisCredentials() !== null
}

function getRedis() {
  if (cachedRedis) return cachedRedis
  const credentials = resolveRedisCredentials()
  if (!credentials) {
    throw new Error(
      'Upstash Redis credentials missing — set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel project env.',
    )
  }
  cachedRedis = new Redis(credentials)
  return cachedRedis
}

function normalizeSnapshot(snapshot: Snapshot): Snapshot {
  const now = new Date().toISOString()
  return {
    ...snapshot,
    meeting: {
      ...snapshot.meeting,
      shareCode: snapshot.meeting.shareCode.toUpperCase(),
    },
    createdAt: snapshot.createdAt || now,
    updatedAt: snapshot.updatedAt || now,
  }
}

export async function readStore(): Promise<MeetingsStore> {
  const raw = await getRedis().hgetall<Record<string, Snapshot>>(MEETINGS_HASH)
  if (!raw) return {}

  return Object.fromEntries(
    Object.entries(raw).map(([code, snapshot]) => [
      code.toUpperCase(),
      normalizeSnapshot(snapshot),
    ]),
  )
}

export async function readMeeting(shareCode: string): Promise<Snapshot | null> {
  const code = shareCode.toUpperCase()
  const snapshot = await getRedis().hget<Snapshot>(MEETINGS_HASH, code)
  return snapshot ? normalizeSnapshot(snapshot) : null
}

export async function writeMeeting(snapshot: Snapshot): Promise<Snapshot> {
  const normalized = normalizeSnapshot({
    ...snapshot,
    updatedAt: new Date().toISOString(),
  })
  await getRedis().hset(MEETINGS_HASH, {
    [normalized.meeting.shareCode]: normalized,
  })
  return normalized
}

export async function deleteMeeting(shareCode: string): Promise<boolean> {
  const code = shareCode.toUpperCase()
  const removed = await getRedis().hdel(MEETINGS_HASH, code)
  return removed > 0
}

export function listMeetings(store: MeetingsStore): Snapshot[] {
  return Object.values(store).sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )
}

function normalizeTeam(team: Team): Team {
  const now = new Date().toISOString()
  const dedupedMembers: string[] = []
  const seen = new Set<string>()
  for (const rawName of team.members ?? []) {
    const trimmed = (rawName ?? '').trim().replace(/\s+/g, ' ')
    if (!trimmed) continue
    const key = trimmed.normalize('NFKC').toLocaleLowerCase('ko-KR')
    if (seen.has(key)) continue
    seen.add(key)
    dedupedMembers.push(trimmed)
  }

  return {
    ...team,
    name: (team.name ?? '').trim(),
    members: dedupedMembers,
    createdAt: team.createdAt || now,
    updatedAt: team.updatedAt || now,
  }
}

export async function readTeamsStore(): Promise<TeamsStore> {
  const raw = await getRedis().hgetall<Record<string, Team>>(TEAMS_HASH)
  if (!raw) return {}
  return Object.fromEntries(
    Object.entries(raw).map(([id, team]) => [id, normalizeTeam(team)]),
  )
}

export async function readTeam(teamId: string): Promise<Team | null> {
  const team = await getRedis().hget<Team>(TEAMS_HASH, teamId)
  return team ? normalizeTeam(team) : null
}

export async function writeTeam(team: Team): Promise<Team> {
  const normalized = normalizeTeam({
    ...team,
    updatedAt: new Date().toISOString(),
  })
  await getRedis().hset(TEAMS_HASH, { [normalized.id]: normalized })
  return normalized
}

export async function deleteTeam(teamId: string): Promise<boolean> {
  const removed = await getRedis().hdel(TEAMS_HASH, teamId)
  return removed > 0
}

export function listTeams(store: TeamsStore): Team[] {
  return Object.values(store).sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  )
}
