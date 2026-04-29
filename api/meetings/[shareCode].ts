import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Snapshot } from '../../shared/meeting.js'
import {
  deleteMeeting,
  isRedisConfigured,
  readMeeting,
  writeMeeting,
} from '../_store.js'

function pickShareCode(request: VercelRequest): string | null {
  const { shareCode } = request.query
  const value = Array.isArray(shareCode) ? shareCode[0] : shareCode
  if (!value || typeof value !== 'string') return null
  return value.toUpperCase()
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

  const shareCode = pickShareCode(request)
  if (!shareCode) {
    response.status(400).json({ message: 'shareCode is required' })
    return
  }

  try {
    if (request.method === 'GET') {
      const meeting = await readMeeting(shareCode)
      if (!meeting) {
        response.status(404).json({ message: 'Meeting not found' })
        return
      }
      response.status(200).json({ meeting })
      return
    }

    if (request.method === 'PUT') {
      const body = (request.body ?? {}) as { meeting?: Snapshot }
      const meeting = body.meeting

      if (!meeting || !meeting.meeting?.shareCode) {
        response.status(400).json({ message: 'Meeting payload is required' })
        return
      }

      if (meeting.meeting.shareCode.toUpperCase() !== shareCode) {
        response.status(400).json({ message: 'Share code mismatch' })
        return
      }

      const stored = await writeMeeting(meeting)
      response.status(200).json({ meeting: stored })
      return
    }

    if (request.method === 'DELETE') {
      const removed = await deleteMeeting(shareCode)
      if (!removed) {
        response.status(404).json({ message: 'Meeting not found' })
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
