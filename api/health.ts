import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  _request: VercelRequest,
  response: VercelResponse,
) {
  const env = {
    UPSTASH_REDIS_REST_URL: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    UPSTASH_REDIS_REST_TOKEN: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
    KV_REST_API_URL: Boolean(process.env.KV_REST_API_URL),
    KV_REST_API_TOKEN: Boolean(process.env.KV_REST_API_TOKEN),
    STORAGE_REST_API_URL: Boolean(process.env.STORAGE_REST_API_URL),
    STORAGE_REST_API_TOKEN: Boolean(process.env.STORAGE_REST_API_TOKEN),
  }

  try {
    const store = await import('./_store')
    response.status(200).json({
      ok: true,
      storage: store.isRedisConfigured() ? 'upstash-redis' : 'unconfigured',
      env,
      date: new Date().toISOString(),
    })
  } catch (error) {
    response.status(500).json({
      ok: false,
      stage: 'import-store',
      env,
      error: error instanceof Error ? error.message : String(error),
      stack:
        error instanceof Error && typeof error.stack === 'string'
          ? error.stack.split('\n').slice(0, 8)
          : undefined,
      date: new Date().toISOString(),
    })
  }
}
