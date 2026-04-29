import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Team } from '../../shared/meeting.js'
import {
  deleteTeam,
  isRedisConfigured,
  readTeam,
  writeTeam,
} from '../_store.js'

function pickTeamId(request: VercelRequest): string | null {
  const { teamId } = request.query
  const value = Array.isArray(teamId) ? teamId[0] : teamId
  if (!value || typeof value !== 'string') return null
  return value
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (!isRedisConfigured()) {
    response.status(503).json({
      message:
        '서버 저장소(Upstash Redis)가 연결되지 않았습니다. Vercel 프로젝트의 Storage 탭에서 Redis 를 추가하세요.',
    })
    return
  }

  const teamId = pickTeamId(request)
  if (!teamId) {
    response.status(400).json({ message: 'teamId is required' })
    return
  }

  try {
    if (request.method === 'GET') {
      const team = await readTeam(teamId)
      if (!team) {
        response.status(404).json({ message: 'Team not found' })
        return
      }
      response.status(200).json({ team })
      return
    }

    if (request.method === 'PUT') {
      const body = (request.body ?? {}) as { team?: Team }
      const team = body.team

      if (!team || !team.id) {
        response.status(400).json({ message: 'Team payload is required' })
        return
      }

      if (team.id !== teamId) {
        response.status(400).json({ message: 'Team id mismatch' })
        return
      }

      const stored = await writeTeam(team)
      response.status(200).json({ team: stored })
      return
    }

    if (request.method === 'DELETE') {
      const removed = await deleteTeam(teamId)
      if (!removed) {
        response.status(404).json({ message: 'Team not found' })
        return
      }
      response.status(204).end()
      return
    }

    response.setHeader('Allow', 'GET, PUT, DELETE')
    response.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    response.status(500).json({ message })
  }
}
