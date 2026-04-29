import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isRedisConfigured } from './_store'

export default function handler(_request: VercelRequest, response: VercelResponse) {
  response.status(200).json({
    ok: true,
    storage: isRedisConfigured() ? 'upstash-redis' : 'unconfigured',
    date: new Date().toISOString(),
  })
}
