import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isRedisConfigured, listMeetings, readStore } from '../_store.js'

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ message: 'Method not allowed' })
    return
  }

  if (!isRedisConfigured()) {
    response.status(503).json({
      message:
        '서버 저장소(Upstash Redis)가 연결되지 않았습니다. Vercel 프로젝트의 Storage 탭에서 Redis 를 추가하세요.',
    })
    return
  }

  try {
    const store = await readStore()
    response.status(200).json({ meetings: listMeetings(store) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    response.status(500).json({ message })
  }
}
